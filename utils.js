
export async function makeJsonCall(query) {
    const uri = "https://hudecekpetr.cz/other/lettermage/api.php?" + query;
    console.log("API: " + uri);
    const response = await fetch(uri);
    const responseAsText = await response.text();
    try {
        let responseAsJsonObject = JSON.parse(responseAsText);
        console.log(responseAsJsonObject);
        return responseAsJsonObject;
    }
    catch (e) {
        console.error(responseAsText);
        return undefined;
    }
}