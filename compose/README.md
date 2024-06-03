# Docker Compose for aelf-playground

A quick way to get aelf-playground running locally.

## Images

- [aelf-playground](../client)
- [playground-service](https://github.com/yongenaelf/playground-service)
- [csharp-language-service](https://github.com/yongenaelf/MonacoRoslynCompletionProvider)

## Start the services

```bash
cd compose           # cd to this folder
docker compose up -d # start the services
```

Open [localhost:8080](http://localhost:8080) using your browser.
