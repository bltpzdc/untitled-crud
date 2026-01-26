const LOCAL_MODE = false;

class DiffuzzerStorage {
  constructor() {
    this.runsById = {};
    this.bugsByKey = {};
  }

  async _fetchJson(path) {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return res.json();
  }

  // Ожидаемый формат объекта испытания с бэкенда:
  // {
  //   id: string,
  //   title: string,
  //   datetime: string (ISO) или число,
  //   fs1: string,
  //   fs2: string,
  //   version: string,
  //   comment: string,
  //   tags: string[]	
  //   bugs: string[]   
  //}
  async get_runs() {
    if (LOCAL_MODE) {
      const make = (id, fs1, fs2, version) => {
        this.runsById[id] = {
          datatype: "run",
          id: id,
          text: `Испытание ${id}`,
          datetime: new Date(),
          run_time: new Date(),
          fstype: [fs1, fs2],
          analyzer: "Diffuzzer",
          version: version,
          comment: "a comment",
          tags: [],
          bugs: [
            {
              "ID": 1,
              text: "Баг 1",
              "RunID": 0,
              "Operation": "LSeek",
              "TestCases": [
                {
                  "ID": 2,
                  "CrashID": 0,
                  "TotalOperations": 0,
                  "Test":
                    '{\n  "ops": [\n    {\n      "MKDIR": {\n        "path": "/9",\n        "mode": [\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "REMOVE": {\n        "path": "/9"\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/",\n        "flags": [\n          "O_RDONLY",\n          "O_DIRECTORY",\n          "O_EXCL",\n          "O_NOFOLLOW"\n        ],\n        "des": 1\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/3",\n        "mode": [\n          "S_IXUSR"\n        ]\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/3",\n        "new_path": "/4"\n      }\n    },\n    {\n      "REMOVE": {\n        "path": "/3"\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/4"\n      }\n    },\n    {\n      "READ": {\n        "des": 1,\n        "size": 100000\n      }\n    },\n    {\n      "PREAD": {\n        "des": 1,\n        "size": 256,\n        "offset": 100000\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/4",\n        "new_path": "/3"\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/",\n        "flags": [\n          "O_RDONLY",\n          "O_DIRECTORY"\n        ],\n        "des": 2\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 1\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/4",\n        "new_path": "/2"\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/3",\n        "mode": [\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 1\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 1\n      }\n    },\n    {\n      "READ": {\n        "des": 2,\n        "size": 32\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 1\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/2",\n        "length": 255\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/3",\n        "new_path": "/3"\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/1",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 2\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 2\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/1",\n        "mode": [\n          "S_IROTH"\n        ]\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/2",\n        "new_path": "/1/5"\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/1/7",\n        "mode": [\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IROTH"\n        ]\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/2",\n        "mode": [\n          "S_IRUSR",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/1",\n        "mode": [\n          "S_IXUSR",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/1",\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/8",\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IXGRP",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/1/8",\n        "mode": [\n          "S_IWUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/4",\n        "name": "user.xqYXEE0QjPWIZkVy8i7oNNLYuTBlAZuEbiN3dPoxXYslNH0n7qgQEwJSwgmxmL0Pkx5a8EgSeDm7ZJmYJ2Rn7XFXV5aAXOW",\n        "src_offset": 32767,\n        "size": 32\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/1/8",\n        "mode": [\n          "S_IWUSR",\n          "S_IRGRP",\n          "S_IXGRP",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/1",\n        "length": 128\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/2",\n        "name": "user.o6RnsZwrH9Cn4vwXmGFZdX9I0O6",\n        "src_offset": 1,\n        "size": 100\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/1/5",\n        "name": "user.o6RnsZwrH9Cn4vwXmGFZdX9I0O6"\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/1/5"\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 1\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/1/5",\n        "name": "user.LAk4zntKCRMM30Xw4P8HK24kqLwkEilwuGWainj5zhyJfVstdgUrLVPjFPmgYjT9vk10hrUV5VKtbpkzCO2f4DYBGUR4foWT66WNOUI7W1mXwyGYisl3kxNMGK",\n        "src_offset": 32767,\n        "size": 32\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/2",\n        "new_path": "/2"\n      }\n    },\n    {\n      "SYMLINK": {\n        "target": "/2",\n        "linkpath": "/1/8/6"\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/2",\n        "name": "user.zExeYooJxjvr43s3w0NZuQmYeTytlOp7ZA5Wmlym75xjDmc8SEqvg1EhABm",\n        "src_offset": 1024,\n        "size": 100\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/1/8",\n        "name": "user.9R0LqFoxoWp",\n        "src_offset": 16,\n        "size": 16\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 1,\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/1",\n        "name": "user.wCS8b1CIVMkpN10oYHGbmyuT2zONfxCdP51Uoxxcoh0HEc7yPF943zkH7NuxvDM850q53zwxrm15dG2joubhiTHXDR5Xzk6S96IhoBZbbBFWmONOEeAPza8VxLM",\n        "src_offset": 1,\n        "size": 1\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/1/5",\n        "mode": [\n          "S_IWUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/1",\n        "new_path": "/1/4"\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/2/3",\n        "mode": [\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 2\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/2",\n        "name": "user.Fgt2C1i4hruoDaP0P6Pz94S9RL5DZ6zWkGzjexmvok2vI4wo6qsVuz5DxcMeaswuXVTnyRHwRkdak8n3zBg2dMhpsz47B1N4gnyUSnacRsgPe8Il3sjO3WERBtFJrI1VjHrEZns33MmTDNysjOYN4WWwEAxIs5lWFthQJNpdKcgEoNO8okzAmkthcmcOykuiamithOzPsxw0tkoVxfAk9LXz8MPuQ4uJhc6OALJP8RDm8UDgcFaxEzKTXg",\n        "src_offset": 100,\n        "size": 32\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/1",\n        "flags": [\n          "O_RDWR",\n          "O_APPEND",\n          "O_SYNC"\n        ],\n        "des": 3\n      }\n    },\n    {\n      "UNLINK": {\n        "path": "/8"\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IXGRP"\n        ]\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/2/3",\n        "length": 127\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/1"\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/1/8",\n        "name": "user.9R0LqFoxoWp"\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/1/5",\n        "name": "user.6HINyMYcevXxhwKQ69KGvq8ILZUld2AtSKgzxpH7kRgtmtvzGfmBWpnT0BVVI2qFtMSfg0iCBU9e9FhdxVT9KHDm6D3tdN5LIeoh5Utj2my4zYqx5YuA35c1nZeUP1SJY6OzYFzAHmp5Bd6eONdPfjGIPahyu2k3oSPHt3vQbDuAfpisVLwuSxtm5zI3WqJ0C9Ucj0si5ur5z0rOAS9USWG0EznDLu0IYylXbZj1QhswdB1QwctbFKLf14",\n        "src_offset": 256,\n        "size": 32\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/1"\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/1/8",\n        "new_path": "/1/5"\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/1/4",\n        "name": "user.0wyW69nlEypyG9adYyE9ZChlREqTfGhr8dTShbBCkMSyPA7Ccm4malNm0QRSL4cjsX1ERvVz8lSM4P9L1TAFDFpUPWTHFcDPeXMIPZqkzNpMDLOgnV3xQTlLe1M9i30g8N4QsTTJW3IHWogBOzoSchSwg3qchI0nEeyNunOxO0lCjozBarIa7WFbyLMUNEWEmAu6xT9e4ql4FscdslFiSJZTLs6Q8cHBVza4sySxFNVmmFt8f3xmWssUOp",\n        "src_offset": 512,\n        "size": 100\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/1"\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/1/8/6",\n        "name": "user.WvWdH2VL8GVVuyq8QuJXeumwoes817K203fPuXheudR31tHDUbRwzBXdN957lAnAKEQ2QiKUaxFltAT4Dnx5UPzAwTbufyDUb6gbKiO2QU4iyoEODFMPKn0f9v4vpDmYroXrTUs3gSlQzG0aFRuCZSTvn1HY3bG2SUnCgdKZ7hjhTaobkAuKs1IuwHggQuoAisbabXEi4enw5DhszkMS2ritouxXSNGXFP5r35zNPwZoaA7gdjKwaTOtI7",\n        "src_offset": 16,\n        "size": 256\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 3,\n        "offset": -32768,\n        "whence": "SEEK_SET"\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/4",\n        "name": "user.o6RnsZwrH9Cn4vwXmGFZdX9I0O6"\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/2",\n        "length": 1024\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 3,\n        "offset": 65535,\n        "whence": "SEEK_SET"\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/1/8/7",\n        "mode": [\n          "S_IRUSR",\n          "S_IXGRP",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/1/5",\n        "name": "user.rUc3Zvo03B8wOfTkkM71CGgXZc15r6GguqWMA5RsWyauIWHXUWG47pvXnasumihrB1pYU6eR8CVwk6qKWETMbpulf0Fsp3k",\n        "src_offset": 1000,\n        "size": 255\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/1/8",\n        "name": "user.9R0LqFoxoWp"\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/1/5",\n        "new_path": "/4"\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 1,\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IROTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/1/8/6",\n        "new_path": "/1/8"\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/4",\n        "length": 512\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 1\n      }\n    },\n    {\n      "FTRUNCATE": {\n        "des": 3,\n        "length": 100000\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 3,\n        "offset": 128,\n        "whence": "SEEK_END"\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/1/4",\n        "length": 4096\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/2/3",\n        "new_path": "/1/8/6"\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/3",\n        "new_path": "/1"\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/1/8",\n        "flags": [\n          "O_RDONLY",\n          "O_DIRECTORY"\n        ],\n        "des": 4\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/1/7",\n        "new_path": "/6"\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 3,\n        "offset": -1,\n        "whence": "SEEK_END"\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/1/7",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IXGRP",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/2"\n      }\n    },\n    {\n      "READ": {\n        "des": 1,\n        "size": 32767\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/1/9",\n        "mode": [\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/1/8/6",\n        "mode": [\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IXGRP"\n        ]\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IXGRP",\n          "S_IROTH"\n        ]\n      }\n    },\n    {\n      "FTRUNCATE": {\n        "des": 3,\n        "length": 64\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/1",\n        "name": "user.Fgt2C1i4hruoDaP0P6Pz94S9RL5DZ6zWkGzjexmvok2vI4wo6qsVuz5DxcMeaswuXVTnyRHwRkdak8n3zBg2dMhpsz47B1N4gnyUSnacRsgPe8Il3sjO3WERBtFJrI1VjHrEZns33MmTDNysjOYN4WWwEAxIs5lWFthQJNpdKcgEoNO8okzAmkthcmcOykuiamithOzPsxw0tkoVxfAk9LXz8MPuQ4uJhc6OALJP8RDm8UDgcFaxEzKTXg"\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/2",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/2",\n        "flags": [\n          "O_RDONLY",\n          "O_APPEND"\n        ],\n        "des": 5\n      }\n    },\n    {\n      "PREAD": {\n        "des": 5,\n        "size": 64,\n        "offset": 16\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/1/4"\n      }\n    },\n    {\n      "WRITE": {\n        "des": 5,\n        "src_offset": 64,\n        "size": 65535\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 5,\n        "offset": 128,\n        "whence": "SEEK_END"\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/1/8"\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/2/3",\n        "new_path": "/5"\n      }\n    }\n  ]\n}',
                  "FSSummaries": [
                    {
                      "ID": 3,
                      "TestCaseID": 0,
                      "FsName": "ext4",
                      "FsSuccessCount": 0,
                      "FsFailureCount": 0,
                      "FsExecutionTime": {
                        "Microseconds": 0,
                        "Days": 0,
                        "Months": 0,
                        "Valid": true,
                      },
                      "FsTrace":
                        '{"rows": [{"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 448}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "REMOVE", "return_code": 0, "execution_time": 194}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 3, "execution_time": 15}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 4, "execution_time": 71}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "old file"}, {"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "HARDLINK", "return_code": 0, "execution_time": 34}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "REMOVE", "return_code": 0, "execution_time": 23}}, {"Success": {"extra": {"hash": 13646096770106105413, "timestamps": []}, "operation": "LISTXATTR", "return_code": 0, "execution_time": 25}}, {"Failure": {"errno": 21, "subcall": "read", "strerror": "Is a directory", "operation": "READ", "return_code": -1}}, {"Failure": {"errno": 21, "subcall": "pread", "strerror": "Is a directory", "operation": "PREAD", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "old parent"}, {"atime": false, "ctime": true, "mtime": true, "owner": "new parent"}]}, "operation": "RENAME", "return_code": 0, "execution_time": 48}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 4, "execution_time": 15}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 277}}, {"Failure": {"errno": 2, "subcall": "rename", "strerror": "No such file or directory", "operation": "RENAME", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 48}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 142}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 1}}, {"Failure": {"errno": 21, "subcall": "read", "strerror": "Is a directory", "operation": "READ", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 1}}, {"Failure": {"errno": 2, "subcall": "truncate", "strerror": "No such file or directory", "operation": "TRUNCATE", "return_code": -1}}, {"Failure": {"errno": 17, "subcall": "link", "strerror": "File exists", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 5, "execution_time": 130}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 155}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 1}}, {"Failure": {"errno": 17, "subcall": "mkdir", "strerror": "File exists", "operation": "MKDIR", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "link", "strerror": "No such file or directory", "operation": "HARDLINK", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 200}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 19}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 15}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 5, "execution_time": 94}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "setxattr", "strerror": "No such file or directory", "operation": "SETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "mkdir", "strerror": "Not a directory", "operation": "MKDIR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 50}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "TRUNCATE", "return_code": 0, "execution_time": 30}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 111}}, {"Failure": {"errno": 20, "subcall": "getxattr", "strerror": "Not a directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "listxattr", "strerror": "Not a directory", "operation": "LISTXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 349}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "old parent"}, {"atime": false, "ctime": false, "mtime": false, "owner": "new parent"}]}, "operation": "RENAME", "return_code": 0, "execution_time": 16}}, {"Failure": {"errno": 20, "subcall": "symlink", "strerror": "Not a directory", "operation": "SYMLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 169}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 15}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 134}}, {"Failure": {"errno": 20, "subcall": "chmod", "strerror": "Not a directory", "operation": "CHMOD", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "link", "strerror": "Not a directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 5, "execution_time": 90}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 240}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 49}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 5, "execution_time": 16}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "UNLINK", "return_code": 0, "execution_time": 65}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 12}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 10}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "TRUNCATE", "return_code": 0, "execution_time": 31}}, {"Success": {"extra": {"hash": 4985934741695125295, "timestamps": []}, "operation": "LISTXATTR", "return_code": 129, "execution_time": 26}}, {"Failure": {"errno": 20, "subcall": "getxattr", "strerror": "Not a directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": 4985934741695125295, "timestamps": []}, "operation": "LISTXATTR", "return_code": 129, "execution_time": 41}}, {"Failure": {"errno": 20, "subcall": "link", "strerror": "Not a directory", "operation": "HARDLINK", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": 4985934741695125295, "timestamps": []}, "operation": "LISTXATTR", "return_code": 129, "execution_time": 47}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Failure": {"errno": 22, "subcall": "lseek", "strerror": "Invalid argument", "operation": "LSEEK", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "getxattr", "strerror": "No such file or directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 21, "subcall": "truncate", "strerror": "Is a directory", "operation": "TRUNCATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "LSEEK", "return_code": 65535, "execution_time": 0}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "getxattr", "strerror": "Not a directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "link", "strerror": "Not a directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 13}}, {"Failure": {"errno": 20, "subcall": "rename", "strerror": "Not a directory", "operation": "RENAME", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "truncate", "strerror": "No such file or directory", "operation": "TRUNCATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 194}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "FTRUNCATE", "return_code": 0, "execution_time": 59}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "LSEEK", "return_code": 100128, "execution_time": 1}}, {"Failure": {"errno": 20, "subcall": "truncate", "strerror": "Not a directory", "operation": "TRUNCATE", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "rename", "strerror": "Not a directory", "operation": "RENAME", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "old parent"}, {"atime": false, "ctime": true, "mtime": true, "owner": "new parent"}]}, "operation": "RENAME", "return_code": 0, "execution_time": 42}}, {"Failure": {"errno": 20, "subcall": "open", "strerror": "Not a directory", "operation": "OPEN", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "link", "strerror": "Not a directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "LSEEK", "return_code": 99999, "execution_time": 0}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Success": {"extra": {"hash": 17958172758850163581, "timestamps": []}, "operation": "LISTXATTR", "return_code": 354, "execution_time": 17}}, {"Failure": {"errno": 21, "subcall": "read", "strerror": "Is a directory", "operation": "READ", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "mkdir", "strerror": "Not a directory", "operation": "MKDIR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 9}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "FTRUNCATE", "return_code": 0, "execution_time": 30}}, {"Failure": {"errno": 61, "subcall": "getxattr", "strerror": "No data available", "operation": "GETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 14}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 6, "execution_time": 18}}, {"Failure": {"errno": 21, "subcall": "pread", "strerror": "Is a directory", "operation": "PREAD", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "listxattr", "strerror": "Not a directory", "operation": "LISTXATTR", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "write", "strerror": "Bad file descriptor", "operation": "WRITE", "return_code": -1}}, {"Failure": {"errno": 22, "subcall": "lseek", "strerror": "Invalid argument", "operation": "LSEEK", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "listxattr", "strerror": "Not a directory", "operation": "LISTXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "old file"}, {"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "HARDLINK", "return_code": 0, "execution_time": 46}}], "failure_n": 47, "success_n": 53}',
                    },
                    {
                      "ID": 4,
                      "TestCaseID": 0,
                      "FsName": "xfs",
                      "FsSuccessCount": 0,
                      "FsFailureCount": 0,
                      "FsExecutionTime": {
                        "Microseconds": 0,
                        "Days": 0,
                        "Months": 0,
                        "Valid": true,
                      },
                      "FsTrace":
                        '{"rows": [{"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 256}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "REMOVE", "return_code": 0, "execution_time": 110}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 3, "execution_time": 11}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 4, "execution_time": 104}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "old file"}, {"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "HARDLINK", "return_code": 0, "execution_time": 75}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "REMOVE", "return_code": 0, "execution_time": 30}}, {"Success": {"extra": {"hash": 13646096770106105413, "timestamps": []}, "operation": "LISTXATTR", "return_code": 0, "execution_time": 18}}, {"Failure": {"errno": 21, "subcall": "read", "strerror": "Is a directory", "operation": "READ", "return_code": -1}}, {"Failure": {"errno": 21, "subcall": "pread", "strerror": "Is a directory", "operation": "PREAD", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "old parent"}, {"atime": false, "ctime": true, "mtime": true, "owner": "new parent"}]}, "operation": "RENAME", "return_code": 0, "execution_time": 428}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 4, "execution_time": 13}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 119}}, {"Failure": {"errno": 2, "subcall": "rename", "strerror": "No such file or directory", "operation": "RENAME", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 27}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 0}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 0}}, {"Failure": {"errno": 21, "subcall": "read", "strerror": "Is a directory", "operation": "READ", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 0}}, {"Failure": {"errno": 2, "subcall": "truncate", "strerror": "No such file or directory", "operation": "TRUNCATE", "return_code": -1}}, {"Failure": {"errno": 17, "subcall": "link", "strerror": "File exists", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 5, "execution_time": 101}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 125}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 0}}, {"Failure": {"errno": 17, "subcall": "mkdir", "strerror": "File exists", "operation": "MKDIR", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "link", "strerror": "No such file or directory", "operation": "HARDLINK", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 223}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 15}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 12}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 5, "execution_time": 50}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "setxattr", "strerror": "No such file or directory", "operation": "SETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "mkdir", "strerror": "Not a directory", "operation": "MKDIR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 12}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "TRUNCATE", "return_code": 0, "execution_time": 31}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 34}}, {"Failure": {"errno": 20, "subcall": "getxattr", "strerror": "Not a directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "listxattr", "strerror": "Not a directory", "operation": "LISTXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 98}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "old parent"}, {"atime": false, "ctime": false, "mtime": false, "owner": "new parent"}]}, "operation": "RENAME", "return_code": 0, "execution_time": 9}}, {"Failure": {"errno": 20, "subcall": "symlink", "strerror": "Not a directory", "operation": "SYMLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 145}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 12}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 29}}, {"Failure": {"errno": 20, "subcall": "chmod", "strerror": "Not a directory", "operation": "CHMOD", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "link", "strerror": "Not a directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 5, "execution_time": 76}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 71}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 34}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 5, "execution_time": 9}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "UNLINK", "return_code": 0, "execution_time": 30}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 10}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 6}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "TRUNCATE", "return_code": 0, "execution_time": 18}}, {"Success": {"extra": {"hash": 4985934741695125295, "timestamps": []}, "operation": "LISTXATTR", "return_code": 129, "execution_time": 14}}, {"Failure": {"errno": 20, "subcall": "getxattr", "strerror": "Not a directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": 4985934741695125295, "timestamps": []}, "operation": "LISTXATTR", "return_code": 129, "execution_time": 8}}, {"Failure": {"errno": 20, "subcall": "link", "strerror": "Not a directory", "operation": "HARDLINK", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": 4985934741695125295, "timestamps": []}, "operation": "LISTXATTR", "return_code": 129, "execution_time": 8}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Failure": {"errno": 22, "subcall": "lseek", "strerror": "Invalid argument", "operation": "LSEEK", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "getxattr", "strerror": "No such file or directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 21, "subcall": "truncate", "strerror": "Is a directory", "operation": "TRUNCATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "LSEEK", "return_code": 65535, "execution_time": 0}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "setxattr", "strerror": "Not a directory", "operation": "SETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "getxattr", "strerror": "Not a directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "link", "strerror": "Not a directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 10}}, {"Failure": {"errno": 20, "subcall": "rename", "strerror": "Not a directory", "operation": "RENAME", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "truncate", "strerror": "No such file or directory", "operation": "TRUNCATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 73}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "FTRUNCATE", "return_code": 0, "execution_time": 21}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "LSEEK", "return_code": 100128, "execution_time": 1}}, {"Failure": {"errno": 20, "subcall": "truncate", "strerror": "Not a directory", "operation": "TRUNCATE", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "rename", "strerror": "Not a directory", "operation": "RENAME", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "old parent"}, {"atime": false, "ctime": true, "mtime": true, "owner": "new parent"}]}, "operation": "RENAME", "return_code": 0, "execution_time": 40}}, {"Failure": {"errno": 20, "subcall": "open", "strerror": "Not a directory", "operation": "OPEN", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "link", "strerror": "Not a directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "LSEEK", "return_code": 99999, "execution_time": 0}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Success": {"extra": {"hash": 17958172758850163581, "timestamps": []}, "operation": "LISTXATTR", "return_code": 354, "execution_time": 16}}, {"Failure": {"errno": 21, "subcall": "read", "strerror": "Is a directory", "operation": "READ", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "mkdir", "strerror": "Not a directory", "operation": "MKDIR", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "creat", "strerror": "Not a directory", "operation": "CREATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMOD", "return_code": 0, "execution_time": 12}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "FTRUNCATE", "return_code": 0, "execution_time": 21}}, {"Failure": {"errno": 61, "subcall": "getxattr", "strerror": "No data available", "operation": "GETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 14}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 6, "execution_time": 9}}, {"Failure": {"errno": 21, "subcall": "pread", "strerror": "Is a directory", "operation": "PREAD", "return_code": -1}}, {"Failure": {"errno": 20, "subcall": "listxattr", "strerror": "Not a directory", "operation": "LISTXATTR", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "write", "strerror": "Bad file descriptor", "operation": "WRITE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "LSEEK", "return_code": 128, "execution_time": 0}}, {"Failure": {"errno": 20, "subcall": "listxattr", "strerror": "Not a directory", "operation": "LISTXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "old file"}, {"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "HARDLINK", "return_code": 0, "execution_time": 65}}], "failure_n": 46, "success_n": 54}',
                    },
                  ],
                },
                {
                  "ID": 1,
                  "CrashID": 0,
                  "TotalOperations": 0,
                  "Test":
                    '{\n  "ops": [\n    {\n      "MKDIR": {\n        "path": "/2",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IWGRP",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/2",\n        "name": "user.1s3eHfYZbsPXkk3MDjZq1ceQ3LeHwliK32ovVi9unPYyYAp0rjlY2WMKPtU57zsXGKo62XxtciYeJrTlPROtWEKiWns9KCLe3mXCENdbd2gePScXAjeMuFPOgifdUMXfnHm6MOaMowD4kFfoCJoRl0Asnz5IRdFstRciYlwZ8oSNszowsR3UkYsxM5GSkiOAYUFuAP5Be88NlcXfE0l8VbagDqurA3PwFqM649mHC4HZVpiVkrUMlhhIGY",\n        "src_offset": 1000,\n        "size": 16\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/2",\n        "mode": [\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/2"\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/2/2",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IROTH",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/2",\n        "flags": [\n          "O_RDONLY"\n        ],\n        "des": 1\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/2"\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 1,\n        "offset": 64,\n        "whence": "SEEK_END"\n      }\n    },\n    {\n      "REMOVEXATTR": {\n        "path": "/2",\n        "name": "user.1s3eHfYZbsPXkk3MDjZq1ceQ3LeHwliK32ovVi9unPYyYAp0rjlY2WMKPtU57zsXGKo62XxtciYeJrTlPROtWEKiWns9KCLe3mXCENdbd2gePScXAjeMuFPOgifdUMXfnHm6MOaMowD4kFfoCJoRl0Asnz5IRdFstRciYlwZ8oSNszowsR3UkYsxM5GSkiOAYUFuAP5Be88NlcXfE0l8VbagDqurA3PwFqM649mHC4HZVpiVkrUMlhhIGY"\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 1\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/2",\n        "name": "user.1s3eHfYZbsPXkk3MDjZq1ceQ3LeHwliK32ovVi9unPYyYAp0rjlY2WMKPtU57zsXGKo62XxtciYeJrTlPROtWEKiWns9KCLe3mXCENdbd2gePScXAjeMuFPOgifdUMXfnHm6MOaMowD4kFfoCJoRl0Asnz5IRdFstRciYlwZ8oSNszowsR3UkYsxM5GSkiOAYUFuAP5Be88NlcXfE0l8VbagDqurA3PwFqM649mHC4HZVpiVkrUMlhhIGY"\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/2/2",\n        "mode": [\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "SYMLINK": {\n        "target": "/2/2",\n        "linkpath": "/2/2/3"\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/2",\n        "flags": [\n          "O_RDONLY",\n          "O_APPEND",\n          "O_TRUNC"\n        ],\n        "des": 2\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/7",\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/2",\n        "new_path": "/7/1"\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 2,\n        "offset": 4096,\n        "whence": "SEEK_SET"\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/2",\n        "name": "user.1s3eHfYZbsPXkk3MDjZq1ceQ3LeHwliK32ovVi9unPYyYAp0rjlY2WMKPtU57zsXGKo62XxtciYeJrTlPROtWEKiWns9KCLe3mXCENdbd2gePScXAjeMuFPOgifdUMXfnHm6MOaMowD4kFfoCJoRl0Asnz5IRdFstRciYlwZ8oSNszowsR3UkYsxM5GSkiOAYUFuAP5Be88NlcXfE0l8VbagDqurA3PwFqM649mHC4HZVpiVkrUMlhhIGY"\n      }\n    },\n    {\n      "PWRITE": {\n        "des": 1,\n        "src_offset": 1024,\n        "size": 65536,\n        "offset": 65536\n      }\n    },\n    {\n      "PREAD": {\n        "des": 1,\n        "size": 127,\n        "offset": 512\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/2/2/3",\n        "mode": [\n          "S_IROTH"\n        ]\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/7/1",\n        "new_path": "/2/2/9"\n      }\n    },\n    {\n      "FTRUNCATE": {\n        "des": 2,\n        "length": 1\n      }\n    },\n    {\n      "PWRITE": {\n        "des": 1,\n        "src_offset": 32768,\n        "size": 1,\n        "offset": 4096\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/2",\n        "new_path": "/2/3"\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/2/3/2/9",\n        "new_path": "/2/3/2/5"\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/7/5",\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/7/1"\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/2/2/9",\n        "mode": [\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "LISTXATTR": {\n        "path": "/2"\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IROTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/2",\n        "name": "user.1s3eHfYZbsPXkk3MDjZq1ceQ3LeHwliK32ovVi9unPYyYAp0rjlY2WMKPtU57zsXGKo62XxtciYeJrTlPROtWEKiWns9KCLe3mXCENdbd2gePScXAjeMuFPOgifdUMXfnHm6MOaMowD4kFfoCJoRl0Asnz5IRdFstRciYlwZ8oSNszowsR3UkYsxM5GSkiOAYUFuAP5Be88NlcXfE0l8VbagDqurA3PwFqM649mHC4HZVpiVkrUMlhhIGY"\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/2/3",\n        "new_path": "/2/2"\n      }\n    },\n    {\n      "CLOSE": {\n        "des": 1\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/2/3",\n        "length": 100000\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/2/3/2/7",\n        "mode": [\n          "S_IWUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FSYNC": {\n        "des": 2\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/2/2/3",\n        "new_path": "/2/3/2/2"\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IRUSR",\n          "S_IRGRP",\n          "S_IWGRP"\n        ]\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/2/3/4",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "PREAD": {\n        "des": 2,\n        "size": 128,\n        "offset": 1024\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/2/2/2/3",\n        "name": "user.Qkvf4pywyBR",\n        "src_offset": 65535,\n        "size": 128\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/2/3/8",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IXGRP",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/2/2",\n        "flags": [\n          "O_RDONLY",\n          "O_DIRECTORY"\n        ],\n        "des": 3\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/2/2/2/3",\n        "new_path": "/2/3/7"\n      }\n    },\n    {\n      "FCHMODAT": {\n        "des": 3,\n        "path": "./3",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "HARDLINKAT": {\n        "old_des": 3,\n        "old_path": "./3",\n        "new_des": 3,\n        "new_path": "./4/4"\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/2/3/2/9",\n        "length": 64\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/7/1",\n        "new_path": "/2/3/4/5"\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/2/2/2/5",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FCHMODAT": {\n        "des": 3,\n        "path": "./2",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IROTH",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "READ": {\n        "des": 2,\n        "size": 100\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/2/2/2/5",\n        "name": "user.Qkvf4pywyBR"\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/2/3/2/3",\n        "new_path": "/2/3/2/6"\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/2/2",\n        "name": "user.Qkvf4pywyBR"\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/7",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IXGRP",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "RENAME": {\n        "old_path": "/2/3/2/6",\n        "new_path": "/2/3/8"\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/2/2/2",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "UNLINK": {\n        "path": "/2/3/2/5"\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/2/3/8",\n        "flags": [\n          "O_RDONLY",\n          "O_DIRECTORY"\n        ],\n        "des": 4\n      }\n    },\n    {\n      "FTRUNCATE": {\n        "des": 2,\n        "length": 32\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/7/1",\n        "mode": [\n          "S_IRUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "PWRITE": {\n        "des": 2,\n        "src_offset": 65535,\n        "size": 1,\n        "offset": 32768\n      }\n    },\n    {\n      "OPEN": {\n        "path": "/2/3/2/6",\n        "flags": [\n          "O_RDONLY",\n          "O_DIRECTORY"\n        ],\n        "des": 5\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/7/4",\n        "mode": [\n          "S_IRUSR",\n          "S_IXGRP",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "GETXATTR": {\n        "path": "/2/2",\n        "name": "user.Qkvf4pywyBR"\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 2,\n        "offset": 128,\n        "whence": "SEEK_CUR"\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/2/3",\n        "new_path": "/2/2/2/4"\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/2/6",\n        "mode": [\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IXGRP",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "READ": {\n        "des": 3,\n        "size": 100000\n      }\n    },\n    {\n      "CHMOD": {\n        "path": "/7/5",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IROTH",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "REMOVEXATTR": {\n        "path": "/2",\n        "name": "user.Qkvf4pywyBR"\n      }\n    },\n    {\n      "TRUNCATE": {\n        "path": "/7/5",\n        "length": 512\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 4,\n        "mode": [\n          "S_IWUSR",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "PWRITE": {\n        "des": 2,\n        "src_offset": 16,\n        "size": 32768,\n        "offset": 16\n      }\n    },\n    {\n      "FCHMODAT": {\n        "des": 5,\n        "path": "./3",\n        "mode": [\n          "S_IRUSR",\n          "S_IRGRP",\n          "S_IROTH",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "READ": {\n        "des": 2,\n        "size": 1\n      }\n    },\n    {\n      "FCHMODAT": {\n        "des": 4,\n        "path": "./2",\n        "mode": [\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH"\n        ]\n      }\n    },\n    {\n      "HARDLINK": {\n        "old_path": "/7/1",\n        "new_path": "/2/3/4/7"\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 5,\n        "mode": [\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "PREAD": {\n        "des": 5,\n        "size": 256,\n        "offset": 255\n      }\n    },\n    {\n      "REMOVEXATTR": {\n        "path": "/2/3",\n        "name": "user.Qkvf4pywyBR"\n      }\n    },\n    {\n      "PREAD": {\n        "des": 4,\n        "size": 65535,\n        "offset": 1\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IWGRP"\n        ]\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/2/9",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "FCHMODAT": {\n        "des": 4,\n        "path": "./3/2",\n        "mode": [\n          "S_IXUSR",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "MKDIRAT": {\n        "des": 3,\n        "path": "./2/2",\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IRGRP"\n        ]\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/2/6/2",\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IWOTH"\n        ]\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/2/3/2/2/3",\n        "mode": [\n          "S_IRUSR",\n          "S_IXUSR",\n          "S_IWGRP",\n          "S_IXGRP"\n        ]\n      }\n    },\n    {\n      "FCHMOD": {\n        "des": 2,\n        "mode": [\n          "S_IRUSR",\n          "S_IRGRP",\n          "S_IWGRP",\n          "S_IXGRP",\n          "S_IROTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "SETXATTR": {\n        "path": "/2/3/7",\n        "name": "user.29C0H5MsKsYvZyyLJOf7eDUhr11iVDufUiVnWtme4G18za3xdkhXZx2l2PEj0mRZGXoJWEAZMvsQ3Tkkviezxh2JKYWl5kKPlUE9eWfxtSGjZH4Jm6RMMVXpfDjEfylNZCElTCW5agD30UwNyL7K9syBJJ4IWPiXScIhTRzmVitmNNRxB1Ed0bjFh6fWnqYNlyQUZBviHCkMDyFhxJ4U6u3RVsIu77v66fPGhYV92Uhq5m0kmonbuEWgRH",\n        "src_offset": 32767,\n        "size": 100\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/6",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IROTH"\n        ]\n      }\n    },\n    {\n      "MKDIRAT": {\n        "des": 0,\n        "path": "/2/3/2/2/7",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXUSR",\n          "S_IRGRP",\n          "S_IXGRP",\n          "S_IROTH"\n        ]\n      }\n    },\n    {\n      "WRITE": {\n        "des": 2,\n        "src_offset": 100,\n        "size": 1000\n      }\n    },\n    {\n      "LSEEK": {\n        "des": 2,\n        "offset": -32768,\n        "whence": "SEEK_SET"\n      }\n    },\n    {\n      "MKDIR": {\n        "path": "/2/6/2/5",\n        "mode": [\n          "S_IWGRP",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "CREATE": {\n        "path": "/3",\n        "mode": [\n          "S_IRUSR",\n          "S_IWUSR",\n          "S_IXGRP",\n          "S_IWOTH",\n          "S_IXOTH"\n        ]\n      }\n    },\n    {\n      "HARDLINKAT": {\n        "old_des": 0,\n        "old_path": "/3",\n        "new_des": 4,\n        "new_path": "./2/6"\n      }\n    },\n    {\n      "WRITE": {\n        "des": 2,\n        "src_offset": 512,\n        "size": 32767\n      }\n    }\n  ]\n}',
                  "FSSummaries": [
                    {
                      "ID": 1,
                      "TestCaseID": 0,
                      "FsName": "ext4",
                      "FsSuccessCount": 0,
                      "FsFailureCount": 0,
                      "FsExecutionTime": {
                        "Microseconds": 0,
                        "Days": 0,
                        "Months": 0,
                        "Valid": true,
                      },
                      "FsTrace":
                        '{"rows": [{"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 306}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "SETXATTR", "return_code": 0, "execution_time": 49}}, {"Failure": {"errno": 21, "subcall": "creat", "strerror": "Is a directory", "operation": "CREATE", "return_code": -1}}, {"Success": {"extra": {"hash": 1153192144263697196, "timestamps": []}, "operation": "LISTXATTR", "return_code": 256, "execution_time": 19}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 126}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 3, "execution_time": 12}}, {"Success": {"extra": {"hash": 1153192144263697196, "timestamps": []}, "operation": "LISTXATTR", "return_code": 256, "execution_time": 12}}, {"Failure": {"errno": 22, "subcall": "lseek", "strerror": "Invalid argument", "operation": "LSEEK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "REMOVEXATTR", "return_code": 0, "execution_time": 37}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "FSYNC", "return_code": 0, "execution_time": 171}}, {"Failure": {"errno": 61, "subcall": "getxattr", "strerror": "No data available", "operation": "GETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 18}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "SYMLINK", "return_code": 0, "execution_time": 73}}, {"Failure": {"errno": 21, "subcall": "open", "strerror": "Is a directory", "operation": "OPEN", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 142}}, {"Failure": {"errno": 1, "subcall": "link", "strerror": "Operation not permitted", "operation": "HARDLINK", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "lseek", "strerror": "Bad file descriptor", "operation": "LSEEK", "return_code": -1}}, {"Failure": {"errno": 61, "subcall": "getxattr", "strerror": "No data available", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "pwrite", "strerror": "Bad file descriptor", "operation": "PWRITE", "return_code": -1}}, {"Failure": {"errno": 21, "subcall": "pread", "strerror": "Is a directory", "operation": "PREAD", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 31}}, {"Failure": {"errno": 2, "subcall": "link", "strerror": "No such file or directory", "operation": "HARDLINK", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "ftruncate", "strerror": "Bad file descriptor", "operation": "FTRUNCATE", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "pwrite", "strerror": "Bad file descriptor", "operation": "PWRITE", "return_code": -1}}, {"Failure": {"errno": 22, "subcall": "rename", "strerror": "Invalid argument", "operation": "RENAME", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "link", "strerror": "No such file or directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 4, "execution_time": 82}}, {"Failure": {"errno": 2, "subcall": "listxattr", "strerror": "No such file or directory", "operation": "LISTXATTR", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "chmod", "strerror": "No such file or directory", "operation": "CHMOD", "return_code": -1}}, {"Success": {"extra": {"hash": 13646096770106105413, "timestamps": []}, "operation": "LISTXATTR", "return_code": 0, "execution_time": 11}}, {"Failure": {"errno": 9, "subcall": "fchmod", "strerror": "Bad file descriptor", "operation": "FCHMOD", "return_code": -1}}, {"Failure": {"errno": 61, "subcall": "getxattr", "strerror": "No data available", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "rename", "strerror": "No such file or directory", "operation": "RENAME", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": []}, "operation": "CLOSE", "return_code": 0, "execution_time": 8}}, {"Failure": {"errno": 2, "subcall": "truncate", "strerror": "No such file or directory", "operation": "TRUNCATE", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "creat", "strerror": "No such file or directory", "operation": "CREATE", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "fsync", "strerror": "Bad file descriptor", "operation": "FSYNC", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "rename", "strerror": "No such file or directory", "operation": "RENAME", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "fchmod", "strerror": "Bad file descriptor", "operation": "FCHMOD", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "mkdir", "strerror": "No such file or directory", "operation": "MKDIR", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "pread", "strerror": "Bad file descriptor", "operation": "PREAD", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "setxattr", "strerror": "No such file or directory", "operation": "SETXATTR", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "creat", "strerror": "No such file or directory", "operation": "CREATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": false, "mtime": false, "owner": "file"}, {"atime": false, "ctime": false, "mtime": false, "owner": "parent"}]}, "operation": "OPEN", "return_code": 3, "execution_time": 27}}, {"Failure": {"errno": 2, "subcall": "link", "strerror": "No such file or directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "FCHMODAT", "return_code": 0, "execution_time": 50}}, {"Failure": {"errno": 9, "subcall": "fchmod", "strerror": "Bad file descriptor", "operation": "FCHMOD", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "linkat", "strerror": "No such file or directory", "operation": "HARDLINKAT", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "truncate", "strerror": "No such file or directory", "operation": "TRUNCATE", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "rename", "strerror": "No such file or directory", "operation": "RENAME", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "chmod", "strerror": "No such file or directory", "operation": "CHMOD", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "fchmodat", "strerror": "No such file or directory", "operation": "FCHMODAT", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "read", "strerror": "Bad file descriptor", "operation": "READ", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "getxattr", "strerror": "No such file or directory", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "link", "strerror": "No such file or directory", "operation": "HARDLINK", "return_code": -1}}, {"Failure": {"errno": 61, "subcall": "getxattr", "strerror": "No data available", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 21, "subcall": "creat", "strerror": "Is a directory", "operation": "CREATE", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "rename", "strerror": "No such file or directory", "operation": "RENAME", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "chmod", "strerror": "No such file or directory", "operation": "CHMOD", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "unlink", "strerror": "No such file or directory", "operation": "UNLINK", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "open", "strerror": "No such file or directory", "operation": "OPEN", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "ftruncate", "strerror": "Bad file descriptor", "operation": "FTRUNCATE", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 231}}, {"Failure": {"errno": 9, "subcall": "pwrite", "strerror": "Bad file descriptor", "operation": "PWRITE", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "open", "strerror": "No such file or directory", "operation": "OPEN", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 4, "execution_time": 70}}, {"Failure": {"errno": 61, "subcall": "getxattr", "strerror": "No data available", "operation": "GETXATTR", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "lseek", "strerror": "Bad file descriptor", "operation": "LSEEK", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "link", "strerror": "No such file or directory", "operation": "HARDLINK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 146}}, {"Failure": {"errno": 21, "subcall": "read", "strerror": "Is a directory", "operation": "READ", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": false, "owner": "file"}]}, "operation": "CHMOD", "return_code": 0, "execution_time": 112}}, {"Failure": {"errno": 61, "subcall": "removexattr", "strerror": "No data available", "operation": "REMOVEXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "file"}]}, "operation": "TRUNCATE", "return_code": 0, "execution_time": 65}}, {"Failure": {"errno": 9, "subcall": "fchmod", "strerror": "Bad file descriptor", "operation": "FCHMOD", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "pwrite", "strerror": "Bad file descriptor", "operation": "PWRITE", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "fchmodat", "strerror": "Bad file descriptor", "operation": "FCHMODAT", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "read", "strerror": "Bad file descriptor", "operation": "READ", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "fchmodat", "strerror": "Bad file descriptor", "operation": "FCHMODAT", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "link", "strerror": "No such file or directory", "operation": "HARDLINK", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "fchmod", "strerror": "Bad file descriptor", "operation": "FCHMOD", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "pread", "strerror": "Bad file descriptor", "operation": "PREAD", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "removexattr", "strerror": "No such file or directory", "operation": "REMOVEXATTR", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "pread", "strerror": "Bad file descriptor", "operation": "PREAD", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "fchmod", "strerror": "Bad file descriptor", "operation": "FCHMOD", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 106}}, {"Failure": {"errno": 9, "subcall": "fchmodat", "strerror": "Bad file descriptor", "operation": "FCHMODAT", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "mkdirat", "strerror": "No such file or directory", "operation": "MKDIRAT", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 126}}, {"Failure": {"errno": 2, "subcall": "creat", "strerror": "No such file or directory", "operation": "CREATE", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "fchmod", "strerror": "Bad file descriptor", "operation": "FCHMOD", "return_code": -1}}, {"Failure": {"errno": 2, "subcall": "setxattr", "strerror": "No such file or directory", "operation": "SETXATTR", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 127}}, {"Failure": {"errno": 2, "subcall": "mkdirat", "strerror": "No such file or directory", "operation": "MKDIRAT", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "write", "strerror": "Bad file descriptor", "operation": "WRITE", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "lseek", "strerror": "Bad file descriptor", "operation": "LSEEK", "return_code": -1}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "MKDIR", "return_code": 0, "execution_time": 97}}, {"Success": {"extra": {"hash": null, "timestamps": [{"atime": false, "ctime": true, "mtime": true, "owner": "parent"}]}, "operation": "CREATE", "return_code": 4, "execution_time": 69}}, {"Failure": {"errno": 9, "subcall": "linkat", "strerror": "Bad file descriptor", "operation": "HARDLINKAT", "return_code": -1}}, {"Failure": {"errno": 9, "subcall": "write", "strerror": "Bad file descriptor", "operation": "WRITE", "return_code": -1}}], "failure_n": 73, "success_n": 27}',
                    },
                  ],
                },
              ],
            },
          ],
        };
      };
      make(0, "xfs", "btrfs", "0xbadcoffee");
      make(1, "xfs", "btrfs", "0xbadcoffee");
      make(2, "xfs", "btrfs", "0xbadcoffee");
      make(3, "xfs", "btrfs", "0xbadcoffee");
    } else {
      const runs = await this._fetchJson("/backend/runs/metadatas");

      for (const run of runs) {
        let runbugs = await this._fetchJson(
          `/backend/runs/details/${run.id}`,
        );
        console.log("runbugs");
        console.log(runbugs);

        runbugs = runbugs.crashes;
        if (runbugs.length == 0){
          continue
        }
        
        let runHash = null;
        if (runbugs.length > 0 && runbugs[0].TestCases && runbugs[0].TestCases.length > 0) {
          runHash = runbugs[0].TestCases[0].Hash;
        }
        
        const displayHash = runHash ? runHash.substring(0, 8) : null;
        
        runbugs = runbugs.filter(x => x.TestCases.length >= 2);
        const fsset = new Set();
        runbugs = runbugs.map(x => {
          for (const tc of x.TestCases){
            for (const fs of tc.FSSummaries){
              fsset.add(fs.FsName);
            }
          }

          let bugHash = null;
          if (x.TestCases && x.TestCases.length > 0 && x.TestCases[0].Hash) {
            bugHash = x.TestCases[0].Hash;
          }
          const bugDisplayHash = bugHash ? bugHash.substring(0, 8) : null;

          const operation = x.Operation || x.operation || "";
          const operationText = operation ? ` (${operation})` : "";
          x.text = bugDisplayHash 
            ? `[${bugDisplayHash}] Баг ${x.ID}${operationText}` 
            : `Баг ${x.ID}${operationText}`;
          x.displayHash = bugDisplayHash; 
          return x;
        })

        console.log("runbugs");
        console.log(runbugs);
        
        const runTags = run.metadata && Array.isArray(run.metadata.tags) 
          ? run.metadata.tags
              .filter(tag => tag != null && tag !== '')
              .map(tag => {
                if (typeof tag === 'string') {
                  return tag.trim();
                }
                if (tag && typeof tag === 'object') {
                  const tagName = tag.Name || tag.name;
                  if (tagName && typeof tagName === 'string') {
                    return tagName.trim();
                  }
                  console.warn("Invalid tag object in run metadata:", tag);
                  return null;
                }
                return String(tag).trim();
              })
              .filter(tag => tag != null && tag.length > 0)
          : [];
        
        let runDateTime = new Date();
        if (run.metadata && run.metadata.timestamp) {
          const parsedDate = new Date(run.metadata.timestamp);
          if (!isNaN(parsedDate.getTime())) {
            runDateTime = parsedDate;
          }
        }
        
        this.runsById[run.id] = {
          datatype: "run",
          id: run.id,
          hash: runHash,
          displayHash: displayHash,
          text: displayHash ? `${displayHash}` : `Испытание ${run.id}`,
          datetime: runDateTime,
          run_time: runDateTime,

          fstype: Array.from(fsset),
          analyzer: "Diffuzzer",
          version: run.version,
          comment: (run.metadata && run.metadata.comment !== null && run.metadata.comment !== undefined)
            ? run.metadata.comment
            : "",
          tags: runTags,
          bugs: runbugs,
        };
      }
    }
    return Object.values(this.runsById);
  }


  async get_runs_by_search(fromDate = null, toDate = null) {
    this.runsById = {};
    
    let url = "/backend/runs/search";
    const params = new URLSearchParams();
    if (fromDate) {
      params.append("fromdate", fromDate);
    }
    if (toDate) {
      params.append("todate", toDate);
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }

    const runs = await this._fetchJson(url);

    for (const run of runs) {
      let runbugs = await this._fetchJson(
        `/backend/runs/details/${run.id}`,
      );

      runbugs = runbugs.crashes;
      if (runbugs.length == 0){
        continue
      }
      
      let runHash = null;
      if (runbugs.length > 0 && runbugs[0].TestCases && runbugs[0].TestCases.length > 0) {
        runHash = runbugs[0].TestCases[0].Hash;
      }
      
      const displayHash = runHash ? runHash.substring(0, 8) : null;
      
      runbugs = runbugs.filter(x => x.TestCases.length >= 2);
      const fsset = new Set();
      runbugs = runbugs.map(x => {
        for (const tc of x.TestCases){
          for (const fs of tc.FSSummaries){
            fsset.add(fs.FsName);
          }
        }
        
        // Извлекаем хэш из TestCases этого бага
        let bugHash = null;
        if (x.TestCases && x.TestCases.length > 0 && x.TestCases[0].Hash) {
          bugHash = x.TestCases[0].Hash;
        }
        const bugDisplayHash = bugHash ? bugHash.substring(0, 8) : null;

        const operation = x.Operation || x.operation || "";
        const operationText = operation ? ` (${operation})` : "";
        x.text = bugDisplayHash 
          ? `[${bugDisplayHash}] Баг ${x.ID}${operationText}` 
          : `Баг ${x.ID}${operationText}`;
        x.displayHash = bugDisplayHash; // Сохраняем хэш бага для использования в UI
        return x;
      })

      const runTags = run.metadata && Array.isArray(run.metadata.tags) 
        ? run.metadata.tags
            .filter(tag => tag != null && tag !== '')
            .map(tag => {
              if (typeof tag === 'string') {
                return tag.trim();
              }
              if (tag && typeof tag === 'object') {
                const tagName = tag.Name || tag.name;
                if (tagName && typeof tagName === 'string') {
                  return tagName.trim();
                }
                console.warn("Invalid tag object in run metadata:", tag);
                return null;
              }
              return String(tag).trim();
            })
            .filter(tag => tag != null && tag.length > 0)
        : [];

      let runDateTime = new Date();
      if (run.metadata && run.metadata.timestamp) {
        const parsedDate = new Date(run.metadata.timestamp);
        if (!isNaN(parsedDate.getTime())) {
          runDateTime = parsedDate;
        }
      }
      
      this.runsById[run.id] = {
        datatype: "run",
        id: run.id,
        hash: runHash,
        displayHash: displayHash,
        text: displayHash ? `${displayHash}` : `Испытание ${run.id}`,
        datetime: runDateTime,
        run_time: runDateTime,

        fstype: Array.from(fsset),
        analyzer: "Diffuzzer",
        version: run.version,
        comment: (run.comment === null || run.comment === undefined)
          ? ""
          : run.comment,
        tags: runTags,
        bugs: runbugs,
      };
    }
    return Object.values(this.runsById);
  }


  async update_run_comment(runId, comment) {
    const response = await fetch(`/backend/runs/${runId}/comment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: comment || null }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update comment: ${errorText}`);
    }
  }


  async delete_run(runId) {
    const response = await fetch(`/backend/runs/${runId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete run: ${errorText}`);
    }
  }


  async upload_zip(file) {
    const formData = new FormData();

    formData.append("file", file);

    const res = await fetch("/backend/v1/runs", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }

    const data = await res.json();

    return {
      id: data.id,
      status: data.status,
    };
  }


  async get_all_tags() {
    const tags = await this._fetchJson("/backend/tags");
    console.log("Raw tags from API:", tags);
    if (Array.isArray(tags)) {
      const tagStrings = tags
        .filter(t => t != null)
        .map(t => {
          if (typeof t === 'string') {
            return t.trim();
          }
          if (t && typeof t === 'object') {
            const tagName = t.Name || t.name;
            if (tagName) {
              if (typeof tagName === 'string') {
                return tagName.trim();
              }
              console.warn("Tag name is not a string:", tagName, "in tag:", t);
              return null;
            }
            console.warn("Tag object without 'name' or 'Name' field:", t);
            return null;
          }
          return String(t).trim();
        })
        .filter(name => name != null && name.length > 0);
      console.log("Processed tags (strings only):", tagStrings);
      return tagStrings;
    }
    console.warn("Tags is not an array:", tags);
    return [];
  }

  async update_run_tags(runId, tags) {
    try {
      const url = `/backend/runs/${runId}/tags`;
      console.log("Updating tags for run", runId, "with tags", tags, "URL:", url);
      
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API error response:", errorText, "Status:", res.status);
        throw new Error(`Failed to update tags: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      console.log("Tags updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error in update_run_tags:", error);
      throw error;
    }
  }


  async get_runs_by_search_with_tags(fromDate = null, toDate = null, tags = []) {
    this.runsById = {};
    
    let url = "/backend/runs/search-with-tags";
    const params = new URLSearchParams();
    if (fromDate) {
      params.append("fromdate", fromDate);
    }
    if (toDate) {
      params.append("todate", toDate);
    }
    if (tags.length > 0) {
      params.append("tags", tags.join(","));
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }

    const runs = await this._fetchJson(url);

    for (const run of runs) {
      let runbugs = await this._fetchJson(
        `/backend/runs/details/${run.id}`,
      );

      runbugs = runbugs.crashes;
      if (runbugs.length == 0){
        continue
      }
      
      let runHash = null;
      if (runbugs.length > 0 && runbugs[0].TestCases && runbugs[0].TestCases.length > 0) {
        runHash = runbugs[0].TestCases[0].Hash;
      }
      
      const displayHash = runHash ? runHash.substring(0, 8) : null;
      
      runbugs = runbugs.filter(x => x.TestCases.length >= 2);
      const fsset = new Set();
      runbugs = runbugs.map(x => {
        for (const tc of x.TestCases){
          for (const fs of tc.FSSummaries){
            fsset.add(fs.FsName);
          }
        }
        
        // Извлекаем хэш из TestCases этого бага
        let bugHash = null;
        if (x.TestCases && x.TestCases.length > 0 && x.TestCases[0].Hash) {
          bugHash = x.TestCases[0].Hash;
        }
        const bugDisplayHash = bugHash ? bugHash.substring(0, 8) : null;

        const operation = x.Operation || x.operation || "";
        const operationText = operation ? ` (${operation})` : "";
        x.text = bugDisplayHash 
          ? `[${bugDisplayHash}] Баг ${x.ID}${operationText}` 
          : `Баг ${x.ID}${operationText}`;
        x.displayHash = bugDisplayHash; // Сохраняем хэш бага для использования в UI
        return x;
      })

      this.runsById[run.id] = {
        datatype: "run",
        id: run.id,
        hash: runHash,
        displayHash: displayHash,
        text: displayHash ? `${displayHash}` : `Испытание ${run.id}`,
        datetime: new Date(),
        run_time: new Date(),

        fstype: Array.from(fsset),
        analyzer: "Diffuzzer",
        version: run.version,
        comment: (run.comment === null || run.comment === undefined)
          ? ""
          : run.comment,
        tags: run.metadata && Array.isArray(run.metadata.tags) 
          ? run.metadata.tags
              .filter(tag => tag != null && tag !== '')
              .map(tag => {
                if (typeof tag === 'string') {
                  return tag.trim();
                }
                if (tag && typeof tag === 'object') {
                  const tagName = tag.Name || tag.name;
                  if (tagName && typeof tagName === 'string') {
                    return tagName.trim();
                  }
                  console.warn("Invalid tag object in run metadata:", tag);
                  return null;
                }
                return String(tag).trim();
              })
              .filter(tag => tag != null && tag.length > 0)
          : [],
        bugs: runbugs,
      };
    }
    return Object.values(this.runsById);
  }
}

export const datalayer = new DiffuzzerStorage();
