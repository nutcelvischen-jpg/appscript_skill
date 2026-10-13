param(
  [int]$Port = 54321
)

$clientId = "1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com"
$clientSecret = "v6V3fKV_zWU7iw1DrpO1rknX"
$redirectUri = "http://localhost:$Port"
$scopes = "https://www.googleapis.com/auth/script.deployments https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/script.webapp.deploy https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/service.management https://www.googleapis.com/auth/logging.read https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/cloud-platform"
$escapedScopes = [System.Uri]::EscapeDataString($scopes)
$escapedRedirect = [System.Uri]::EscapeDataString($redirectUri)

$authUrl = "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&scope=$escapedScopes&response_type=code&client_id=$clientId&redirect_uri=$escapedRedirect"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("$redirectUri/")
$listener.Start()

Write-Host "=== GAS_AUTH_READY ==="
Write-Host "URL: $authUrl"

# Open browser for user authorization
Start-Process $authUrl

# Wait up to 300 seconds for callback
$asyncResult = $listener.BeginGetContext($null, $null)
$signaled = $asyncResult.AsyncWaitHandle.WaitOne(300000)

if (-not $signaled) {
  $listener.Stop()
  Write-Host "=== GAS_AUTH_TIMEOUT ==="
  exit 1
}

$context = $listener.EndGetContext($asyncResult)
$request = $context.Request
$response = $context.Response

$code = $request.QueryString["code"]
$error = $request.QueryString["error"]

if ($code) {
  $html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Authorization successful</title></head><body style='font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:60px 20px;background:#f8fafc;'><div style='max-width:480px;margin:0 auto;background:#fff;padding:40px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.05);'><div style='font-size:48px;margin-bottom:16px;'>&#x2705;</div><h2 style='color:#0f172a;margin-bottom:12px;'>Google Apps Script authorized!</h2><p style='color:#64748b;line-height:1.6;'>Go back to the AI assistant chat. It will now create and publish your clock-in page automatically!</p></div></body></html>"
  $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
  $response.ContentLength64 = $buffer.Length
  $response.ContentType = "text/html; charset=utf-8"
  $response.OutputStream.Write($buffer, 0, $buffer.Length)
  $response.OutputStream.Close()
  $listener.Stop()

  # Exchange code for tokens
  $tokenBody = @{
    code = $code
    client_id = $clientId
    client_secret = $clientSecret
    redirect_uri = $redirectUri
    grant_type = "authorization_code"
  }
  $tokenRes = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method Post -Body $tokenBody

  $claspRc = @{
    token = @{
      access_token = $tokenRes.access_token
      refresh_token = $tokenRes.refresh_token
      scope = $tokenRes.scope
      token_type = $tokenRes.token_type
      expiry_date = ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() + ($tokenRes.expires_in * 1000))
    }
    oauth2ClientSettings = @{
      clientId = $clientId
      clientSecret = $clientSecret
      redirectUri = $redirectUri
    }
    isLocalCreds = $false
  }

  $claspPath = Join-Path $HOME ".clasprc.json"
  $claspRc | ConvertTo-Json -Depth 5 | Set-Content -Path $claspPath -Encoding UTF8
  Write-Host "=== GAS_AUTH_SUCCESS ==="
  Write-Host "Saved to: $claspPath"
} else {
  $listener.Stop()
  Write-Host "=== GAS_AUTH_ERROR: $error ==="
  exit 1
}
