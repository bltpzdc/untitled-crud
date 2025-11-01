Reason
======

Trace Difference Found
----------------------

Different traces for operation #0:

```json
{"Success":{"operation":"SHRINK","return_code":0,"execution_time":361,"extra":{"hash":null,"timestamps":[{"owner":"dir","atime":true,"mtime":true,"ctime":true}]}}}
{"Success":{"operation":"SHRINK","return_code":0,"execution_time":87,"extra":{"hash":null,"timestamps":[{"owner":"dir","atime":true,"mtime":false,"ctime":false}]}}}
```

Different traces for operation #1:

```json
{"Success":{"operation":"SHRINK","return_code":0,"execution_time":28,"extra":{"hash":null,"timestamps":[{"owner":"dir","atime":true,"mtime":false,"ctime":false}]}}}
{"Success":{"operation":"SHRINK","return_code":0,"execution_time":15,"extra":{"hash":null,"timestamps":[{"owner":"dir","atime":false,"mtime":false,"ctime":false}]}}}
```

Different traces for operation #48:

```json
{"Success":{"operation":"PREAD","return_code":0,"execution_time":1,"extra":{"hash":1873913666579263196,"timestamps":[{"owner":"file","atime":false,"mtime":false,"ctime":false}]}}}
{"Success":{"operation":"PREAD","return_code":0,"execution_time":50,"extra":{"hash":1873913666579263196,"timestamps":[{"owner":"file","atime":true,"mtime":false,"ctime":false}]}}}
```

