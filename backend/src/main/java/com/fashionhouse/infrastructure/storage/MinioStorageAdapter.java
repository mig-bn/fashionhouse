package com.fashionhouse.infrastructure.storage;

import com.fashionhouse.application.port.StoragePort;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
public class MinioStorageAdapter implements StoragePort {

    private final MinioClient minioClient;
    private final String endpoint;

    public MinioStorageAdapter(MinioClient minioClient,
                               @Value("${minio.endpoint}") String endpoint) {
        this.minioClient = minioClient;
        this.endpoint = endpoint;
    }

    @Override
    public String upload(String bucketName, String objectName, InputStream data,
                         long size, String contentType) {
        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(data, size, -1)
                    .contentType(contentType)
                    .build()
            );
            return getPublicUrl(bucketName, objectName);
        } catch (Exception e) {
            throw new RuntimeException("Error al subir archivo a MinIO: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String bucketName, String objectName) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar archivo de MinIO: " + e.getMessage(), e);
        }
    }

    @Override
    public String getPublicUrl(String bucketName, String objectName) {
        return endpoint + "/" + bucketName + "/" + objectName;
    }
}
