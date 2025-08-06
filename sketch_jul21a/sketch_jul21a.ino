// proyecto de PST - ESP32 con WiFi y servos
// Este código conecta un ESP32 a una red WiFi y controla tres servos con botones
// Utiliza la librería Servo y WiFi de Arduino
// Asegúrate de tener instaladas las librerías necesarias en tu entorno de desarrollo

#include <ESP32Servo.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define BUTTON1_PIN 12
#define BUTTON2_PIN 14
#define BUTTON3_PIN 27

#define SERVO1_PIN 25
#define SERVO2_PIN 26
#define SERVO3_PIN 33

Servo servo1;
Servo servo2;
Servo servo3;

// Estructura para almacenar las redes WiFi
struct WifiRed {
  const char* ssid;
  const char* password;
};

// Lista de redes disponibles
WifiRed redes[] = {
  {"Lab. Telematica", "l4bt3l3m4tic@"},
  {"NETLIFE-APOLO ACOSTA", "jorbelsan1525"},
  {"RedUniversidad", "wifi2025"}
};
// Configuración del cliente HTTP
// URL del backend para enviar datos
const char* backendUrl = "http://192.168.100.112:8081/lecturas";
// Crear cliente HTTP y Wifi
HTTPClient http;
WiFiClient wifi;
const int TOTAL_RED = sizeof(redes) / sizeof(redes[0]);


void setup() {
  // Definir las redes WiFi disponibles
  Serial.begin(115200);
  delay(1000);

  Serial.println("Iniciando conexión WiFi...");

  bool conectado = false;

  for (int i = 0; i < TOTAL_RED; i++) {
    Serial.print("Intentando conectar a: ");
    Serial.println(redes[i].ssid);

    WiFi.begin(redes[i].ssid, redes[i].password);

    // Esperar hasta 10 segundos para conectarse
    int tiempo_espera = 0;
    while (WiFi.status() != WL_CONNECTED && tiempo_espera < 20) {
      delay(500);
      Serial.print(".");
      tiempo_espera++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println();
      Serial.print("✅ Conectado a ");
      Serial.println(redes[i].ssid);
      Serial.print("IP asignada: ");
      Serial.println(WiFi.localIP());
      conectado = true;
      break;
    } else {
      Serial.println();
      Serial.println("❌ No se pudo conectar.");
    }
  }

  if (!conectado) {
    Serial.println("⚠️ No se pudo conectar a ninguna red.");
  }
  
  // Inicializar botones con pull-up interno
  pinMode(BUTTON1_PIN, INPUT_PULLUP);
  pinMode(BUTTON2_PIN, INPUT_PULLUP);
  pinMode(BUTTON3_PIN, INPUT_PULLUP);

  // Adjuntar servos a sus pines
  servo1.attach(SERVO1_PIN);
  servo2.attach(SERVO2_PIN);
  servo3.attach(SERVO3_PIN);

  // Posición inicial de los servos
  servo1.write(0);
  servo2.write(0);
  servo3.write(0);
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


void moverServo(Servo &servo) {
  servo.write(180);       // Girar
  delay(2000);            // Esperar 2 segundos
  servo.write(0);         // Volver a la posición original
  delay(500);             // Pequeña pausa para evitar doble lectura
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

// ... El resto del código de setup() y loop() se mantiene igual ...

void sendData(const char* food_type, float grams) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Error: no conectado a WiFi.");
    return;
  }

  HTTPClient http;
  http.begin(backendUrl);
  http.addHeader("Content-Type", "application/json");

  // Usa la función mejorada para obtener el timestamp
  String timestamp = getISO8601Timestamp();

  StaticJsonDocument<200> doc;
  doc["food_type"] = food_type;
  doc["grams_dispensed"] = grams;
  doc["timestamp"] = serialized(timestamp); // 'serialized' evita que el JSON añada comillas extra

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