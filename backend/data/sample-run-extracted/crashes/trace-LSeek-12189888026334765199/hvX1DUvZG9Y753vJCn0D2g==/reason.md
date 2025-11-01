Reason
======

Trace Difference Found
----------------------

Different traces for operation #59:

```json
{"Success":{"operation":"LSEEK","return_code":9223372036854775807,"execution_time":1,"extra":{"hash":null,"timestamps":[]}}}
{"Success":{"operation":"LSEEK","return_code":0,"execution_time":1,"extra":{"hash":null,"timestamps":[]}}}
```

Different traces for operation #96:

```json
{"Failure":{"operation":"LSEEK","subcall":"lseek","return_code":-1,"errno":22,"strerror":"Invalid argument"}}
{"Success":{"operation":"LSEEK","return_code":1,"execution_time":1,"extra":{"hash":null,"timestamps":[]}}}
```

