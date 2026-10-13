Add-Type -AssemblyName System.Web.Extensions
$serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$serializer.MaxJsonLength = [int]::MaxValue

$clasp = Get-Content -Raw "$HOME\.clasprc.json" | ConvertFrom-Json
$accessToken = $clasp.token.access_token
$scriptId = "1Q3wGzMhJNay6AExifhKH9GsvaQI16YHY84d4ha-yk8cKGVLcLfgSPgc5"

Write-Host "1. Reading script file..."
$code = Get-Content -Raw -Encoding UTF8 "c:\Users\User\Desktop\1013\clock_in_webapp.gs"
$codeJsonString = $serializer.Serialize($code)

$manifestJsonString = $serializer.Serialize(@'
{
  "timeZone": "Asia/Taipei",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
'@)

$payload = "{`"files`":[{`"name`":`"appsscript`",`"type`":`"JSON`",`"source`":$manifestJsonString},{`"name`":`"Code`",`"type`":`"SERVER_JS`",`"source`":$codeJsonString}]}"

[System.IO.File]::WriteAllText("c:\Users\User\Desktop\1013\gas_payload.json", $payload, [System.Text.Encoding]::UTF8)
Write-Host "2. gas_payload.json written, size: $((Get-Item 'c:\Users\User\Desktop\1013\gas_payload.json').Length) bytes"

Write-Host "3. Uploading code to script project $scriptId ..."
$updateRes = curl.exe -s -X PUT "https://script.googleapis.com/v1/projects/$scriptId/content" `
  -H "Authorization: Bearer $accessToken" `
  -H "Content-Type: application/json; charset=utf-8" `
  --data-binary "@c:\Users\User\Desktop\1013\gas_payload.json"

Write-Host "Update result:" $updateRes

Write-Host "4. Creating Version 1..."
$verRes = curl.exe -s -X POST "https://script.googleapis.com/v1/projects/$scriptId/versions" `
  -H "Authorization: Bearer $accessToken" `
  -H "Content-Type: application/json; charset=utf-8" `
  -d '{\"description\":\"打卡網頁發布版 v1\"}'

Write-Host "Version result:" $verRes

Write-Host "5. Creating Web App deployment..."
$deployPayload = '{\"versionNumber\":1,\"manifestFileName\":\"appsscript\",\"description\":\"員工上班打卡系統公開部署\"}'
$deployRes = curl.exe -s -X POST "https://script.googleapis.com/v1/projects/$scriptId/deployments" `
  -H "Authorization: Bearer $accessToken" `
  -H "Content-Type: application/json; charset=utf-8" `
  -d $deployPayload

Write-Host "Deploy result:" $deployRes
