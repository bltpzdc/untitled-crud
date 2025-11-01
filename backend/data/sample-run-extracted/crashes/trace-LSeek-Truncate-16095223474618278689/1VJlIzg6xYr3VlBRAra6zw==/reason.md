Reason
======

Trace Difference Found
----------------------

Different traces for operation #31:

```json
{"Failure":{"operation":"LSEEK","subcall":"lseek","return_code":-1,"errno":22,"strerror":"Invalid argument"}}
{"Success":{"operation":"LSEEK","return_code":16,"execution_time":1,"extra":{"hash":null,"timestamps":[]}}}
```

Different traces for operation #37:

```json
{"Success":{"operation":"LSEEK","return_code":1,"execution_time":1,"extra":{"hash":null,"timestamps":[]}}}
{"Success":{"operation":"LSEEK","return_code":17,"execution_time":0,"extra":{"hash":null,"timestamps":[]}}}
```

Different traces for operation #43:

```json
{"Success":{"operation":"LSEEK","return_code":1025,"execution_time":1,"extra":{"hash":null,"timestamps":[]}}}
{"Success":{"operation":"LSEEK","return_code":1041,"execution_time":0,"extra":{"hash":null,"timestamps":[]}}}
```

Different traces for operation #48:

```json
{"Success":{"operation":"TRUNCATE","return_code":0,"execution_time":54,"extra":{"hash":null,"timestamps":[{"owner":"file","atime":false,"mtime":true,"ctime":true}]}}}
{"Success":{"operation":"TRUNCATE","return_code":0,"execution_time":22,"extra":{"hash":null,"timestamps":[{"owner":"file","atime":false,"mtime":false,"ctime":false}]}}}
```

