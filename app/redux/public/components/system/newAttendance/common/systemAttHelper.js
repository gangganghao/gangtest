
/**
 * 获取晚走玩到规则的上下班时间
 * @param timeStr 正常上下班时间 例如：'9:00'
 * @param delayTimeNumber 晚走或者晚到小时数 例如：2.5
 */
export function getDelayTimeStr(timeStr, delayTimeNumber) {
    let minutes = Number(timeStr.split(':')[0]) * 60 + Number(timeStr.split(':')[1]) + Number(delayTimeNumber) * 60;
    let dutyHour = parseInt(minutes / 60);
    let dutyMinute = minutes - dutyHour * 60;
    timeStr = `${dutyHour}: ${dutyMinute < 10 ? `0${dutyMinute}` : dutyMinute}`;
    return timeStr;
}

/**
 * 将时间对象转为 "09:00" 这样的时间格式的字符串
 * @param timeMoment 时间对象
 */
export function transformMomentToTime(timeMoment) {
    let hourStr = timeMoment.hour().toString();
    let minuteStr = timeMoment.minute().toString();
    if (hourStr.length === 1) hourStr = `0${hourStr}`;
    if (minuteStr.length === 1) minuteStr = `0${minuteStr}`;
    return `${hourStr}:${minuteStr}`;
}

/**
 * 将 "09:00" 这样的时间格式的字符串转为 时间对象
 * @param timeStr "09:00" 这样的时间格式的字符串
 */
export function transformTimeToMoment(timeStr) {
    let momentObj = moment();
    if (timeStr && typeof timeStr === 'string') {
        momentObj = moment().set({ 'hour': timeStr.split(':')[0], minute: timeStr.split(':')[1] });
    }
    return momentObj;
}