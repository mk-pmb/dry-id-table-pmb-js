
<!--#echo json="package.json" key="name" underline="=" -->
dry-id-table-pmb
================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
A data format specialized for storing enumerated translation tables with
repeating words or phrases.
<!--/#echo -->



Usage
-----

:TODO:



<!--#toc stop="scan" -->



Format specs
------------

* Names of content variables have to start with a letter `a`…`z`, `A`…`Z`
  or a printable character with a Unicode codepoint greater than U+00A0.
  * Other variable names are reserved for control, configuration and syntax
    purposes.
    Nonetheless, interpreters may treat any subset thereof as content
    variables.




Known issues
------------

* needs more/better tests and docs




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
