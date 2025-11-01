Reason
======

Trace Difference Found
----------------------

Different traces for operation #30:

```json
{"Success":{"operation":"TRUNCATE","return_code":0,"execution_time":26,"extra":{"hash":null,"timestamps":[{"owner":"file","atime":false,"mtime":true,"ctime":true}]}}}
{"Success":{"operation":"TRUNCATE","return_code":0,"execution_time":6,"extra":{"hash":null,"timestamps":[{"owner":"file","atime":false,"mtime":false,"ctime":false}]}}}
```

Different traces for operation #85:

```json
{"Failure":{"operation":"LSEEK","subcall":"lseek","return_code":-1,"errno":22,"strerror":"Invalid argument"}}
{"Success":{"operation":"LSEEK","return_code":100000,"execution_time":1,"extra":{"hash":null,"timestamps":[]}}}
```

