/** 工具类函数 **/
function isValidJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

module.exports = {
	isValidJson: isValidJson
}
