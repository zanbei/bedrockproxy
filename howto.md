# 如何通过全球加速连接Bedrock


## 前置条件

部署CDK后会获得Cloudfront Endpoint，或者配置了其他自定义域名。
> Cloudfront endpoint为`https://xxx.cloudfront.net`

## 通过AWS SDK Custom Endpoint实现转发

我们可以通过AWS SDK提供的功能，或其他方式进行流量转发， 

我们下面主要介绍通过AWS SDK转发的两种方式:
1. 在系统中设置环境变量`AWS_ENDPOINT_URL_BEDROCK_RUNTIME`，SDK会自动加载环境变量获取定制的URL地址。
2. 如果无法控制环境变量，则在程序初始化client之前声明环境变量。注意在JAVA程序中环境变量为驼峰写法aws.endpointUrlBedrockRuntime。Python程序为AWS_ENDPOINT_URL_BEDROCK_RUNTIME

SDK Custom Endpoint的具体说明可查看：[AWS SDK 参考指南](https://docs.aws.amazon.com/sdkref/latest/guide/feature-ss-endpoints.html)。同时请注意不同语言SDK对Custom endpoint功能的适配程度以及版本要求。


## 针对Docker compose容器环境配置

1. 在`.env`文件中增加:
```
AWS_ENDPOINT_URL_BEDROCK_RUNTIME=https://xxx.cloudfront.net
```

2. 在docker-compose配置文件中加载环境变量:
```yaml
environment:
  AWS_ENDPOINT_URL_BEDROCK_RUNTIME: ${AWS_ENDPOINT_URL_BEDROCK_RUNTIME}
```

3. 验证环境变量:
```bash
docker exec -it <container_name> bash
env | grep AWS_ENDPOINT
```

## 针对K8S设置环境变量

1. ConfigMap 配置
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  AWS_ENDPOINT_URL_BEDROCK_RUNTIME: "https://xxx.cloudfront.net"
```

2. Pod 配置
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  containers:
  - name: my-container
    image: my-image
    env:
    - name: AWS_ENDPOINT_URL_BEDROCK_RUNTIME
      valueFrom:
        configMapKeyRef:
          name: my-config
          key: AWS_ENDPOINT_URL_BEDROCK_RUNTIME
    
    envFrom:
    - configMapRef:
        name: my-config
```

## Java程序内设置环境变量

```java
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;
import software.amazon.awssdk.core.SdkBytes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class BedrockRuntimeCustomEndpointExample {
    public static void main(String[] args) {
        // 设置系统属性来配置Bedrock Runtime的自定义endpoint
        System.setProperty("aws.endpointUrlBedrockRuntime", "https://xxx.cloudfront.net");

        // 创建Bedrock Runtime客户端
        BedrockRuntimeClient bedrockRuntimeClient = BedrockRuntimeClient.builder()
                .region(Region.US_EAST_1)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
```

## 应用配置说明

完成环境变量配置后，应用可按照正常方式使用Bedrock服务。

### DIFY平台配置示例
<img width="414" alt="image" src="https://github.com/user-attachments/assets/a7ac057f-2667-446f-8cb7-156181e0a7e4">
