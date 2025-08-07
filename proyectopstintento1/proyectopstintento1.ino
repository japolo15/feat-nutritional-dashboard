#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>

const char* ssid     = "Lab. Telematica";
const char* password = "l4bt3l3m4tic@";
const char* backendUrl = "http://192.168.100.125:8081/readings";

// Pin de los botones y Servos
#define BUTTON1_PIN 15
#define BUTTON2_PIN 16
#define BUTTON3_PIN 17

#define SERVO1_PIN 2
#define SERVO2_PIN 4
#define SERVO3_PIN 5

// --- DECLARACIONES DE VARIABLES GLOBALES ---
Servo servo1;
Servo servo2;
Servo servo3;

// Objetos para NTP y WiFi
WiFiUDP ntpUDP;
// El offset en segundos. -18000s = -5 horas para Guayaquil, Ecuador.
NTPClient timeClient(ntpUDP, "pool.ntp.org", -18000, 60000); 

// Estados de los botones para evitar rebotes y envíos múltiples
int button1_state = HIGH;
int button2_state = HIGH;
int button3_state = HIGH;
// ------------------------------------------

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON1_PIN, INPUT_PULLUP);
  pinMode(BUTTON2_PIN, INPUT_PULLUP);
  pinMode(BUTTON3_PIN, INPUT_PULLUP);

  servo1.attach(SERVO1_PIN);
  servo2.attach(SERVO2_PIN);
  servo3.attach(SERVO3_PIN);
  
  // Conexión WiFi
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("¡Conectado!");
  
  // Inicializa el cliente NTP
  timeClient.begin();
  timeClient.update();
}

void moverServo(Servo& servo) {
    // Implementa la lógica para mover el servo
    // Por ejemplo:
    servo.write(180);
    delay(1000);
    servo.write(0);
}

// Función para obtener el timestamp en formato ISO 8601
String getISO8601Timestamp() {
  timeClient.update();
  time_t epochTime = timeClient.getEpochTime();
  struct tm *timeinfo = localtime(&epochTime);
  char buffer[32];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
  return String(buffer);
}

void sendData(const char* food_type, float grams) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Error: no conectado a WiFi.");
    return;
  }

  HTTPClient http;
  http.begin(backendUrl);
  http.addHeader("Content-Type", "application/json");

  String timestamp = getISO8601Timestamp();

  StaticJsonDocument<200> doc;
  doc["food_type"] = food_type;
  doc["grams_dispensed"] = grams;
  // --- ¡SOLUCIÓN AQUÍ! ---
  // Quitamos serialized() para que ArduinoJson añada las comillas dobles
  doc["timestamp"] = timestamp;

  String payload;
  serializeJson(doc, payload);

  Serial.print("Payload a enviar: ");
  Serial.println(payload);

  int code = http.POST(payload);
  
  if (code > 0) {
    String response = http.getString();
    Serial.printf("HTTP %d: %s\n", code, response.c_str());
  } else {
    Serial.printf("Error HTTP: %s\n", http.errorToString(code).c_str());
  }
  
  http.end();
}

void loop() {
  // Lógica de los botones
  int currentButton1_state = digitalRead(BUTTON1_PIN);
  if (currentButton1_state == LOW && button1_state == HIGH) {
    Serial.println("Botón 1 presionado.");
    moverServo(servo1);
    sendData("almendras", 25.0); // Ejemplo: 25g de almendras
    delay(100); // Pequeño delay para el rebote
  }
  button1_state = currentButton1_state;

  int currentButton2_state = digitalRead(BUTTON2_PIN);
  if (currentButton2_state == LOW && button2_state == HIGH) {
    Serial.println("Botón 2 presionado.");
    moverServo(servo2);
    sendData("nueces", 30.0); // Ejemplo: 30g de nueces
    delay(100);
  }
  button2_state = currentButton2_state;

  int currentButton3_state = digitalRead(BUTTON3_PIN);
  if (currentButton3_state == LOW && button3_state == HIGH) {
    Serial.println("Botón 3 presionado.");
    moverServo(servo3);
    sendData("anacardos", 20.0); // Ejemplo: 20g de anacardos
    delay(100);
  }
  button3_state = currentButton3_state;

  // Un pequeño delay general para evitar sobrecargar el loop
  delay(50);
}