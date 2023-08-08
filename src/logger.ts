/**
 * @author Jay Wang
 * @email jay@zijie.wang
 * @license MIT
 */

/**
 * @typedef {Object} LogValue A value that an interaction event changes
 * @property {string} name Value name
 * @property {string | number | number[]} value Value
 */

/**
 * @typedef {Object} Log A single event log
 * @property {string} eventName A string from ['click', 'dragEnd',
 *  'mouseEnter', 'mouseLeave']
 * @property {string} elementName Name of element that handles the event
 * @property {Date} time Timestamp for the event
 * @property {LogValue | null} oldValue The old value that this interaction
 *  changes from
 * @property {LogValue | null} newValue The new value that this interaction
 *  changes to
 */

interface LogValue {
  name: string;
  value: string;
}

interface Log {
  eventName: string;
  elementName: string;
  time: Date;
  oldValue: LogValue;
  newValue: LogValue;
}

type Record = [string, string, Date];

/**
 * An object to log interaction events.
 */
export class Logger {
  logs: Log[];
  initialValues: unknown | null;
  startTime: Date;
  records: Record[];

  /**
   * Initialize a new Logger object.
   * @param {any} [initialValues] Any objects to store with the logger
   */
  constructor(initialValues = null) {
    this.logs = [];
    this.initialValues = initialValues;
    this.startTime = new Date();
    // Create a map to register any object on the fly
    this.records = [];
  }

  /**
   * Add a new log event
   * @param eventName A string from ['click', 'dragEnd', 'mouseEnter',
   *  'mouseLeave'] or any other given name
   * @param elementName Name of the element that users interact with
   * @param valueName Name of the given value
   * @param oldValue Old value that this interaction changes from
   * @param newValue New value that this interaction changes to
   */
  addLog(
    eventName: string,
    elementName: string,
    valueName: string,
    oldValue = '',
    newValue = ''
  ) {
    // Create a time stamp if it is not given
    const timeStamp = new Date();

    // Create value objects if they are given
    const oldValueObj = {
      name: valueName,
      value: oldValue
    };

    const newValueObj = {
      name: valueName,
      value: newValue
    };

    // Create a new Log object
    const newLog: Log = {
      eventName,
      elementName,
      time: timeStamp,
      oldValue: oldValueObj,
      newValue: newValueObj
    };

    this.logs.push(newLog);
  }

  /**
   * Overwrite the initial values
   */
  setInitialValues(initialValues: unknown) {
    this.initialValues = initialValues;
  }

  /**
   * Add a key value pair to the internal record map.
   * @param key Key name
   * @param value Any serializable object
   */
  addRecord(key: string, value: string) {
    this.records.push([key, value, new Date()]);
  }

  /**
   * Detect the current OS and add the info to the record.
   */
  addOSRecord() {
    let osName = 'Unknown OS';

    if (navigator.userAgent.indexOf('Win') != -1) osName = 'windows';
    if (navigator.userAgent.indexOf('Mac') != -1) osName = 'mac';
    if (navigator.userAgent.indexOf('Linux') != -1) osName = 'linux';
    if (navigator.userAgent.indexOf('Android') != -1) osName = 'android';
    if (navigator.userAgent.indexOf('like Mac') != -1) osName = 'ios';

    this.addRecord('os', osName);
  }

  /**
   * Export the logs as an object
   * @param {any} [endValues] Any values to exported with the log
   */
  getLogOutput(endValues = null) {
    const exportLog = {
      logs: this.logs,
      startTime: this.startTime,
      endTime: new Date(),
      initialValues: this.initialValues,
      endValues: endValues,
      records: this.records
    };
    return exportLog;
  }
}
