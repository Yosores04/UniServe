param([Parameter(Mandatory = $true)][string]$Task)

$studioJbr = Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'
if (Test-Path "$studioJbr\bin\java.exe") {
    $env:JAVA_HOME = $studioJbr
}
if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
    $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
& "$PSScriptRoot\..\android\gradlew.bat" -p "$PSScriptRoot\..\android" $Task
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($Task -eq 'assembleRelease') {
    $ErrorActionPreference = 'Stop'
    $sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $env:ANDROID_SDK_ROOT }
    $buildTools = Get-ChildItem -LiteralPath (Join-Path $sdk 'build-tools') -Directory |
        Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' -and (Test-Path (Join-Path $_.FullName 'apksigner.bat')) } |
        Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
    if (-not $buildTools) { throw 'Install Android SDK Build-Tools to verify the release signature.' }

    $buildDir = Join-Path $PSScriptRoot '..\android\app\build'
    $apk = Join-Path $buildDir 'outputs\apk\release\app-release.apk'
    & (Join-Path $buildTools.FullName 'apksigner.bat') verify --verbose --print-certs $apk
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $destination = New-Item -ItemType Directory -Force -Path (Join-Path $buildDir 'distributions')
    $asset = Join-Path $destination.FullName 'UniServe.apk'
    Copy-Item -LiteralPath $apk -Destination $asset
    Get-FileHash -LiteralPath $asset -Algorithm SHA256 | Format-List Algorithm, Hash, Path
}
exit 0
