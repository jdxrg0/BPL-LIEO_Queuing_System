$dockerUp = $false
for ($i=0; $i -lt 30; $i++) {
    $result = docker ps 2>&1
    if ($result -match "CONTAINER ID") {
        $dockerUp = $true
        break
    }
    Write-Host "Waiting..."
    Start-Sleep -Seconds 2
}

if ($dockerUp) {
    Write-Host "Docker is up! Running docker-compose..."
    docker-compose up -d --build frontend
} else {
    Write-Host "Docker failed to start after 60 seconds."
}
