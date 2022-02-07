# Edgestream.net SDK Example (Typescript/NodeJS)

Example API service written in Typescript/Javascript running on NodeJS.

## Install

Update package dependencies:

``` 
npm install
```

Run a local development server:

```
npm run serve
```

Deploy to Kubernetes:

```
kubectl apply -f manifest
```

## Usage

Open a browser and connect to https://example.edgestream.net/status

### API methods

| URL     | Description                                      |
|---------|--------------------------------------------------|
| /status | Overall application status                       |

## Build

Build a new docker image:

```
docker build --tag=registry.edgestream.net/edgestream/example-ts-nodejs:latest .
```

Push image into private registry:

```
docker push registry.edgestream.net/edgestream/example-ts-nodejs:latest
```