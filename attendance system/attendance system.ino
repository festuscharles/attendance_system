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

int redLedPin = 2;
int greenLedPin = 4;
bool ledState = false;


void setup() {
  pinMode(redLedPin, OUTPUT);
  pinMode(greenLedPin, OUTPUT);
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
  //webSocket.begin("192.168.43.171", 81, "/");
  webSocket.begin("wss://attendance-system-zmr0.onrender.com", 10000, "/");

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
      if (strcmp((char*)payload, "GREEN_ON") == 0) {
        digitalWrite(greenLedPin, HIGH);
        delay(1000);
      } else if (strcmp((char*)payload, "GREEN_OFF") == 0) {
        digitalWrite(greenLedPin, LOW);
      } else if (strcmp((char*)payload, "RED_ON") == 0) {
        digitalWrite(redLedPin, HIGH);
        delay(1000);
      } else if (strcmp((char*)payload, "RED_OFF") == 0) {
        digitalWrite(redLedPin, LOW);
        delay(1000);
      }
      break;
  }
}
