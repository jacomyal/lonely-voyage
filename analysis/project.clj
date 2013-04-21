(defproject nasa/lonely-voyage "0.1.0"
  :description "Space app challenge"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 ;;[clj-time "0.5.0"]
                 [joda-time "2.2"]
                 [cheshire "5.1.1"]

                 [incanter/incanter-core "1.4.1"]
                 [incanter/incanter-charts "1.4.1"]

                 [org.clojure/data.csv "0.1.2"]
                 [org.clojure/tools.logging "0.2.4"]]
  :aot :all)
