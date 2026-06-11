package com.fashionhouse.application.port;

import java.io.InputStream;

public interface StoragePort {

    String upload(String bucketName, String objectName, InputStream data,
                  long size, String contentType);

    void delete(String bucketName, String objectName);

    String getPublicUrl(String bucketName, String objectName);
}
