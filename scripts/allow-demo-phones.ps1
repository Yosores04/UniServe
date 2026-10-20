$ErrorActionPreference = 'Stop'
$demoIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$demoPrincipal = [Security.Principal.WindowsPrincipal]::new($demoIdentity)
if (-not $demoPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Open PowerShell as Administrator, go to the project folder, and run npm run demo:firewall.'
}
$demoRuleName = 'UniServe-LAN-Demo-5173'
$demoNodePath = (Get-Command node.exe).Source
if (-not (Get-NetFirewallRule -Name $demoRuleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -Name $demoRuleName -DisplayName 'UniServe phone demo (local subnet, port 5173)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -RemoteAddress LocalSubnet -Program $demoNodePath -Profile Private,Public -EdgeTraversalPolicy Block | Out-Null
}
Write-Host 'Phone demo access is allowed for Node.js on port 5173 from the local subnet.'
Write-Host 'Only use the demo on a network you trust. Start it with npm run demo.'
Write-Host 'To remove this rule later: Remove-NetFirewallRule -Name UniServe-LAN-Demo-5173'
