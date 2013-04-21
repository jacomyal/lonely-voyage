Lonely Voyage retraces some of the main events that took place on planet Earth while Voyager was taking its long journey to the infinity of space.

We travel alongside Voyager through a timeline that covers the fields of Sciences and technology, history, and culture.


Team :

    Alexis Jacomy interface development (html and javascript)
    Philippe Guillebert trajectory data processing (clojure)
    Josquin Debaz data crunching (python), graphics (the Gimp)
    Nils Grünwald data crunching (clojure)
    Nolwenn Guellec editorial contents

Thanks to :

Betty Queffelec, Marion Boucharlat, Jack Higgins, David Fossé.


JSON path format:
  0: time (ms since 1970)
  1: x (meters)
  2: y (meters)
  3: vx (meters/s "whatever", velocity on x)
  4: vy (meters/s "whatever", velocity on y)
  5: c (1/meters, curvature)

TODO Interface:
  . Add Earth at the first frame
  . Add other planets orbits when crossed
  . Add travelled distance
  . Add distance to the Sun
  . Add direction to the Sun
  . Add direction to Earth
