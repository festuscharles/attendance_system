#include <WiFi.h>
#include <WebSocketsClient.h>
#include <MFRC522.h>

// WiFi credentials
const char* ssid = "server";
const char* password = "12345678";


// RFID reader configuration
#define RST_PIN   22
#define SS_PIN    21
MFRC522 rfid(SS_PIN, RST_PIN);

// WebSocket client
WebSocketsClient webSocket;

int ledPin = 2;
bool ledState = false;


void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  delay(10);

// We start by connecting to a WiFi network

  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  
  Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    
  // Connect to WebSocket server
  // server address, port and URL
  webSocket.begin("192.168.43.171", 81, "/");

  // event handler
  webSocket.onEvent(onWebSocketEvent);

  // try ever 5000 again if connection has failed
	webSocket.setReconnectInterval(5000);
  
  // Initialize RFID reader
  SPI.begin();
  rfid.PCD_Init();
}

void loop() {
  // Check for new RFID tag detections
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    // Convert tag UID to string
    String tagId = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      tagId += String(rfid.uid.uidByte[i], HEX);
    }
    Serial.println(tagId);
    // Send tag ID to server via WebSocket
    webSocket.sendTXT(tagId);

    // Clear tag UID buffer
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }
  //webSocket.sendTXT("0000001111111");
  webSocket.loop();
}

void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("Disconnected from WebSocket server.");
      break;
    case WStype_CONNECTED:
      Serial.println("Connected to WebSocket server.");
      break;
    case WStype_TEXT:
      Serial.print("Received message from server: ");
      Serial.println((char*)payload);
      if (strcmp((char*)payload, "ON") == 0) {
        ledState = true;
        digitalWrite(ledPin, HIGH);
        delay(500);
        digitalWrite(ledPin, LOW);
      } else if (strcmp((char*)payload, "OFF") == 0) {
        ledState = false;
        digitalWrite(ledPin, LOW);
      }
      break;
  }
}
