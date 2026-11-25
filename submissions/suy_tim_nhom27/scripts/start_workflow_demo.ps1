param(
    [string]$PgBin = 'D:/Tool/PostgreSQL/18/bin',
    [string]$Python = "$env:TEMP/hf-workflow-c3-venv/Scripts/python.exe",
    [switch]$RestartApp
)
$ErrorActionPreference='Stop'
$demoPath=Join-Path $env:TEMP 'hf-test-workflow-db'
$expectedPath=[IO.Path]::GetFullPath((Join-Path $env:TEMP 'hf-test-workflow-db'))
if([IO.Path]::GetFullPath($demoPath) -ne $expectedPath){throw 'Unexpected temporary demo path'}
$scriptRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
if(!(Test-Path -LiteralPath "$demoPath/PG_VERSION")){
    if(Test-Path -LiteralPath $demoPath){throw 'Refuse preexisting non-cluster directory'}
    if(Get-NetTCPConnection -State Listen -LocalPort 5450 -ErrorAction SilentlyContinue){throw 'Port 5450 already in use'}
    & "$PgBin/initdb.exe" -D $demoPath -U postgres -A trust --encoding=UTF8 --locale=C
    if($LASTEXITCODE -ne 0){throw 'initdb failed'}
}
& "$PgBin/pg_ctl.exe" -D $demoPath status *> $null
if($LASTEXITCODE -ne 0){
    $pgArgs=@('-D',('"'+$demoPath+'"'),'-l',('"'+$demoPath+'/postgres.log"'),'-o','"-p 5450 -h 127.0.0.1"','-w','start')
    $ctl=Start-Process -FilePath "$PgBin/pg_ctl.exe" -ArgumentList $pgArgs -WindowStyle Hidden -PassThru
    if(!$ctl.WaitForExit(30000)){throw 'PostgreSQL start timed out'}
    if($ctl.ExitCode -ne 0){throw 'PostgreSQL start failed'}
}
& "$PgBin/pg_isready.exe" -h 127.0.0.1 -p 5450 -U postgres
if($LASTEXITCODE -ne 0){throw 'PostgreSQL not ready'}
& $Python "$scriptRoot/setup_workflow_demo.py"
if($LASTEXITCODE -ne 0){throw 'Demo setup failed'}
if(Get-NetTCPConnection -State Listen -LocalPort 8010 -ErrorAction SilentlyContinue){
    if(!$RestartApp){
        Write-Output 'Port 8010 is already listening; no process was replaced.'
        exit 0
    }
    $listener=Get-NetTCPConnection -State Listen -LocalPort 8010
    $recordedId=[int](Get-Content -LiteralPath "$demoPath/app.pid")
    $actual=Get-CimInstance Win32_Process -Filter "ProcessId=$recordedId"
    if($listener.OwningProcess -ne $recordedId -or !$actual -or $actual.CommandLine -notlike '*run_workflow_demo.py*'){
        throw 'Refuse restart: port 8010 is not the recorded demo app'
    }
    Stop-Process -Id $recordedId
}
$appProcess=Start-Process -FilePath $Python -ArgumentList ('"'+$scriptRoot+'/run_workflow_demo.py"') -WindowStyle Hidden -PassThru -RedirectStandardOutput "$demoPath/app.out.log" -RedirectStandardError "$demoPath/app.err.log"
Set-Content -LiteralPath "$demoPath/app-launcher.pid" -Value $appProcess.Id -Encoding ascii
$deadline=(Get-Date).AddSeconds(25)
do {
    try {
        $health=Invoke-RestMethod 'http://127.0.0.1:8010/api/v1/health' -TimeoutSec 2
        if($health.status -eq 'ok' -and $health.persistence -eq 'postgres'){
            $listener=Get-NetTCPConnection -State Listen -LocalPort 8010
            Set-Content -LiteralPath "$demoPath/app.pid" -Value $listener.OwningProcess -Encoding ascii
            Write-Output 'Demo ready: http://127.0.0.1:8010 (PostgreSQL 5450, form v1.2)'
            exit 0
        }
    } catch {}
    Start-Sleep -Milliseconds 300
} while((Get-Date) -lt $deadline)
throw 'Demo app did not become healthy; inspect temporary app.err.log'
