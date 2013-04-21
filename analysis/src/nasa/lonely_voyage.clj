(ns nasa.lonely-voyage
  (:use [incanter.core :as incanter]
        [incanter.stats :as stats]
        [incanter.charts :as charts])
  (:require [clojure.java.io :as io]
            [clojure.string :as str]
            [cheshire.core :refer :all])
  (:gen-class))

(defn interpolate
  []
  (let [
        a [2455181.500000
           -3711055114.9824290276
           -13241366913.6749305725
           9574978027.667068]
        b [2455191.500000
           -3712858995.3778042793
           -13253238047.6126041412
           9583549275.806581]
        [tb xb yb zb] b
        [ta xa ya za] a
        dt (- tb ta)
        dx (/ (- xb xa) dt)
        dy (/ (- yb ya) dt)

        cx (- xa (* dx ta))
        cy (- ya (* dy ta))

        dates (range 2455201.500000 2458001.500000 10)
        ]

    (map (fn [d]
           [d
            (+ cx (* dx d))
            (+ cy (* dy d))
            zb])
         dates
         )))

(defn read-csv
  [filename]
  (let [data (slurp filename)
        lines (str/split data #"\n")]
    (map (fn [line]
           (str/split line #"\s"))
         lines)))

(defn read-julian-date
  [str]
  (.getMillis
   (org.joda.time.DateTime.
    (org.joda.time.DateTimeUtils/fromJulianDay
     (Double/parseDouble str)))))

(defn read-julian-date3
  [double]
  (.getMillis
   (org.joda.time.DateTime.
    (org.joda.time.DateTimeUtils/fromJulianDay
     double))))

(defn parse-double
  [str]
  (Double/parseDouble str))

(defn normalize-line
  [[t x y z]]
    [(/ (read-julian-date t) 1000) ;; seconds
     (* 1000 (parse-double x)) ;; meters
     (* 1000 (parse-double y))
     (* 1000 (parse-double z))])

(defn normalize-line2
  [[t x y z]]
  [(/ (read-julian-date3 t) 1000) ;; seconds
   (* 1000 x) ;; meters
   (* 1000 y)
   (* 1000 z)])

(defn mk-data
  ([] (mk-data "./voyager1.xyz"))
  ([csvfile]
     (let [provided (map normalize-line
                         (read-csv csvfile))
           interpolated (map normalize-line2
                             (interpolate))]
       (concat provided interpolated))))

(defn point-at
  [data point]
  (println (nth data point)))

(defn test-data
  [data]
  (let [good (filter (fn [[t x y z]]
                       (< (java.lang.Math/abs z) 60000000))
                     data)]
    (println (first good))
    (println (last good))
    good))

(defn norm
  [x y]
  (java.lang.Math/sqrt
   (+ (java.lang.Math/pow x 2)
      (java.lang.Math/pow y 2))))

(defn vels
  [p1 p2]
  (let [[t1 x1 y1 z1] p1
        [t2 x2 y2 z2] p2
        dt (- t2 t1)
        dx (- x2 x1)
        dy (- y2 y1)
        velx (/ dx dt)
        vely (/ dy dt)]
    [velx vely]))

(defn velx
  [p1 p2]
  (first (vels p1 p2)))

(defn vely
  [p1 p2]
  (second (vels p1 p2)))

(defn accs
  [p0 p1 p2]
  (let [[vx1 vy1] (vels p0 p1)
        [vx2 vy2] (vels p1 p2)
        t2 (first p2)
        t1 (first p1)
        dt  (- t2 t1)
        dvx (- vx2 vx1)
        dvy (- vy2 vy1)
        accx (/ dvx dt)
        accy (/ dvy dt)]
    [accx accy]))

(defn accx
  [p0 p1 p2]
  (first (accs p0 p1 p2)))

(defn accy
  [p0 p1 p2]
  (second (accs p0 p1 p2)))

(defn curvature
  [p0 p1 p2]
  (let [accx (accx p0 p1 p2)
        accy (accy p0 p1 p2)
        velx (velx p1 p2)
        vely (vely p1 p2)

        num (* 1000000000
               (- (* velx accy)
                  (* vely accx)))

        den (java.lang.Math/pow
             (+ (java.lang.Math/pow velx 2)
                (java.lang.Math/pow vely 2))
             1.5)]
    (/ num den)))


(defn smoothing
  [data]
  (loop [toprocess data
         out []]
    (if-let [p0 (nth toprocess 0 nil)]
      (if-let [p1 (nth toprocess 1 nil)]
        (if-let [p2 (nth toprocess 2 nil)]
          (let [sum (+ p0 p1 p2)
                n (/ sum 3)]
            (recur
             (rest toprocess)
             (conj out n)))
          out)
        out)
      out)))

(defn smoothing2
  [data]
  (loop [toprocess data
         out []]
    (if-let [p0 (nth toprocess 0 nil)]
      (if-let [p1 (nth toprocess 1 nil)]
        (if-let [p2 (nth toprocess 2 nil)]
          (if-let [p3 (nth toprocess 3 nil)]
            (if-let [p4 (nth toprocess 4 nil)]
              (let [sum (+ p0 p1 p2 p3 p4)
                    n (/ sum 5)]
                (recur
                 (rest toprocess)
                 (conj out n)))
              out)
            out)
          out)
        out)
      out)))

(defn maxout
  [c max]
  (if (> c max)
    max
    (if (< c (- 0 max))
      (- 0 max)
      c)))

(defn process-data
  [data]
  (loop [toprocess data
         out []]
    (if-let [p0 (nth toprocess 0 nil)]
      (if-let [p1 (nth toprocess 1 nil)]
        (if-let [p2 (nth toprocess 2 nil)]
          (let [[t1 x1 y1 z1] p1
                [t2 x2 y2 z2] p2
                dx (- x2 x1)
                dy (- y2 y1)
                alpha (atan (/ dx dy))
                velx (velx p1 p2)
                vely (vely p1 p2)
                curv (curvature p0 p1 p2)
                ]
            (recur
             (rest toprocess)
             (conj out [t1 x1 y1
                        velx vely curv])))
          out)
        out)
      out)))

(defn floor
  [x]
  (java.lang.Math/floor x))

(defn dump-data
  [filename data]
  (let [data (sort-by first data)
        t (map #(nth % 0) data)
        t (map #(* 1000 %) t) ;; ms epoch

        x (map #(nth % 1) data)
        x (map #(/ % 1000) x) ;; km
        y (map #(nth % 2) data)
        y (map #(/ % 1000) y) ;; km

        ;; r (map #(nth % 3) data)
        ;; a (map #(nth % 4) data)

        vx (map #(nth % 3) data)
        vy (map #(nth % 4) data)
        ;; v (map #(nth % 7) data)
        c (map #(nth % 5) data)
        curv (map #(maxout % 0.01) c)
        curv (smoothing2
              (smoothing2
               (smoothing2
                (smoothing2
                 (smoothing2 curv)))))
        alld (map (fn [tt xx yy vvx vvy ccurv]
                    [tt
                     (floor xx)
                     (floor yy)
                     (floor vvx)
                     (floor vvy)
                     ccurv])
                  t x y vx vy curv)]
    (generate-stream alld
                     (clojure.java.io/writer filename))))

(defn view-data
  [tak data]
  (let [data (sort-by first data)
        data (take tak data)
        t (map #(nth % 0) data)
        x (map #(nth % 1) data)
        y (map #(nth % 2) data)
        vx (map #(nth % 3) data)
        vy (map #(nth % 4) data)
        c (map #(nth % 5) data)
        ]

    (view (scatter-plot x y :legend "XY plot"))
    (view (xy-plot t vx :legend "velocity x"))
    (view (xy-plot t vy :legend "velocity y"))
    (view (xy-plot t c :legend "curvature plot"))
    ))
