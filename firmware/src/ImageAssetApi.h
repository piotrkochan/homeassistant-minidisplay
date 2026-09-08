#pragma once

#include <Arduino.h>

#include "WebServerCompat.h"

class ImageAssetApi {
 public:
  using Authenticate = bool (*)();

  ImageAssetApi(MiniDisplayWebServer &server, bool &filesystemReady,
                Authenticate authenticate);

  void begin();

 private:
  void list();
  void download();
  void uploadChunk();
  void remove();
  void sendError(int status, const __FlashStringHelper *error,
                 const __FlashStringHelper *message);
  uint32_t freeBytes() const;

  static ImageAssetApi *instance_;
  static void listRoute();
  static void uploadRoute();
  static void removeRoute();

  MiniDisplayWebServer &server_;
  bool &filesystemReady_;
  Authenticate authenticate_;
};
