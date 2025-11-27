/* TODO(savikin): I can't figure out how to make iteration
 * over dictionaries work in JS, so for now I am coding this
 * as arrays with 'key' field to filter over, but this 
 * really really really needs to be fixed through dictionaries.
 * */

/* TODO(savikin): to jdenv?
 *  Organize data storage as exported variable/variables
 *  2 usecases:
 *    -  local only
 *    -  remote
 *        figure out and establish the API boundary between this data
 *        module and the network interaction module made by gamatacy
 *
 *        things to not forget: async? promises? this will have to be async
 *          one way or another to some extent
 *
 *    starting with local only
 *  Wrap all the data in classes with convenience methods, probably maybe?
 *    - For all data related things make functions that return localized strings?
 * */

export let storage = [
  { 
    datatype: 'run',
    text: 'Испытание 1',
    run_time: new Date(),
    fstype: ['ext4', 'xfs'],
    analyzer: 'Diffuzzer v.deadbeef',

    bugs: [
      'XHwSwS4tX2U-fpF2paBIfw==',
      'lCUmLg1qGCqHfdzIIHZY0w=='
    ],
  },
  { 
    datatype: 'run',
    text: 'Испытание 2',
    run_time: new Date(),
    fstype: ['ext4', 'btrfs'],
    analyzer: 'Diffuzzer EXPERIMENTAL',

    bugs: [
      'LXBfPRz9NnttomSzB5in3Q=='
    ]
  },
  { 
    datatype: 'run',
    text: 'Испытание 3',
    run_time: new Date(),
    fstype: ['ext4', 'zfs'],
    analyzer: 'Diffuzzer v27',

    bugs: [
      'wWFa_9m7b-xlRufW0UMxUA=='
    ]
  },
]

export let storage_bugs = [
  {
    key: 'XHwSwS4tX2U-fpF2paBIfw==',
    text: 'XHwSwS4tX2U-fpF2paBIfw==',
    optype: 'Read',
    reason: [
      {'Failure':{'operation':'LSEEK','subcall':'lseek','return_code':-1,'errno':22,'strerror':'Invalid argument'}},
      {'Success':{'operation':'LSEEK','return_code':1024,'execution_time':0,'extra':{'hash':null,'timestamps':[]}}}
    ]
  },
  {
    key: 'lCUmLg1qGCqHfdzIIHZY0w==',
    text: 'lCUmLg1qGCqHfdzIIHZY0w==',
    optype: 'Read',
    reason: [
      {'Failure':{'operation':'LSEEK','subcall':'lseek','return_code':-1,'errno':22,'strerror':'Invalid argument'}},
      {'Success':{'operation':'LSEEK','return_code':1024,'execution_time':0,'extra':{'hash':null,'timestamps':[]}}}
    ]
  },
  {
    key: 'LXBfPRz9NnttomSzB5in3Q==',
    text: 'LXBfPRz9NnttomSzB5in3Q==',
    optype: 'Read',
    reason: [
      {'Failure':{'operation':'LSEEK','subcall':'lseek','return_code':-1,'errno':22,'strerror':'Invalid argument'}},
      {'Success':{'operation':'LSEEK','return_code':1024,'execution_time':0,'extra':{'hash':null,'timestamps':[]}}}
    ]
  },
  {
    key: 'wWFa_9m7b-xlRufW0UMxUA==',
    text: 'wWFa_9m7b-xlRufW0UMxUA==',
    optype: 'Read',
    reason: [
      {'Failure':{'operation':'LSEEK','subcall':'lseek','return_code':-1,'errno':22,'strerror':'Invalid argument'}},
      {'Success':{'operation':'LSEEK','return_code':1024,'execution_time':0,'extra':{'hash':null,'timestamps':[]}}}
    ]
  },
]

export function setStorage(argument){
  storage = argument
}
