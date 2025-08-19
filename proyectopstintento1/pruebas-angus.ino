#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>
#include "HX711.h"

WiFiUDP ntpUDP;
// El offset en segundos. -18000s = -5 horas para Guayaquil, Ecuador.
NTPClient timeClient(ntpUDP, "pool.ntp.org", -18000, 60000); 

const char* ssid     = "ClubTaws";
const char* password = "t@ws.W1f1";
const char* backendUrl = "http://192.168.100.113:8081/readings";

#define BUTTON1_PIN 15
#define BUTTON2_PIN 16
#define BUTTON3_PIN 17

int button1_state = HIGH;
int button2_state = HIGH;
int button3_state = HIGH;

#define SERVO1_PIN 2
#define SERVO2_PIN 4
#define SERVO3_PIN 5

Servo servo1;
Servo servo2;
Servo servo3;

// Variables para guardar última posición
int posServo1 = 0;
int posServo2 = 0;
int posServo3 = 0;

// Pines HX711
const int LOADCELL_DOUT_PIN = 27;
const int LOADCELL_SCK_PIN = 26;

HX711 scale;

// -------------------------------------------------------------------
// 📌 mover motores y guardar posición
// -------------------------------------------------------------------
void moverServo(Servo& s, int id) {
  switch (id) {
    case 1:
      s.write(180);  delay(180);
      s.write(90);    delay(180);
      s.write(180); 
      break;
    case 2:
      s.write(180);    delay(180);
      s.write(270);  delay(180);
      s.write(180);  
      break;
    case 3:
      s.write(180);    delay(180);
      s.write(270);  delay(180);
      s.write(180);
      break;
  }
  //Serial.printf("Servo %d ahora está en %d°\n", id, posicion);
}

// -------------------------------------------------------------------
// 📌 Función que toma dos lecturas y devuelve la diferencia
// -------------------------------------------------------------------
float getPesoHX711(unsigned long intervalo = 500) {
  if (!scale.is_ready()) {
    Serial.println("HX711 no encontrado.");
    return 0;
  }

  float primera_lectura = scale.get_units(10);
  Serial.printf("Peso 1: %.2f g\n", primera_lectura);

  delay(intervalo);

  float segunda_lectura = scale.get_units(10);
  Serial.printf("Peso 2: %.2f g\n", segunda_lectura);

  float diferencia = segunda_lectura - primera_lectura;
  Serial.printf("Diferencia: %.2f g\n", diferencia);
  return diferencia;
}

// -------------------------------------------------------------------
// 📌 time stamp
// -------------------------------------------------------------------
String getISO8601Timestamp() {
  timeClient.update();
  time_t epochTime = timeClient.getEpochTime();
  struct tm *timeinfo = localtime(&epochTime);
  char buffer[32];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
  return String(buffer);
}

// -------------------------------------------------------------------
// 📌 enviar datos 
// -------------------------------------------------------------------
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
// -------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  pinMode(BUTTON1_PIN, INPUT_PULLUP);
  pinMode(BUTTON2_PIN, INPUT_PULLUP);
  pinMode(BUTTON3_PIN, INPUT_PULLUP);

  setCpuFrequencyMhz(80);

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(200);  // ⚠️ Ajusta con tu calibración real
  scale.tare();

  Serial.println("Iniciando balanza...");
  delay(2000);
  Serial.println("Balanza lista.");

  // 🔹 attach de los servos aquí
  servo1.attach(SERVO1_PIN);
  servo2.attach(SERVO2_PIN);
  servo3.attach(SERVO3_PIN);

  servo1.write(180); 
  servo2.write(180); 
  servo3.write(180); 

  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");

  }
  Serial.println("¡Conectado!");

  timeClient.begin();
  timeClient.update();
}

// -------------------------------------------------------------------
void loop() {
  // --- BOTÓN 1 ---
  int currentButton1_state = digitalRead(BUTTON1_PIN);
  if (currentButton1_state == LOW && button1_state == HIGH) {
    Serial.println("Botón 1 presionado.");

    moverServo(servo1, 1);

    float peso = getPesoHX711();
    Serial.printf("Función retornó diferencia = %.2f g\n", peso);

    // Espera a que tienda a cero
    /*while (peso > 2) {
      peso = scale.get_units(5);
      delay(200);
    }*/
    sendData("almendras",peso);
    Serial.printf("Almendras %.2f g\n", peso);
    
    delay(100);
  }
  button1_state = currentButton1_state;







  //boton 2 ---------------------------------------------------------------
  int currentButton2_state = digitalRead(BUTTON2_PIN);
  if (currentButton2_state == LOW && button2_state == HIGH) {
    Serial.println("Botón 1 presionado.");

    moverServo(servo2, 2);

    float peso = getPesoHX711();
    Serial.printf("Función retornó diferencia = %.2f g\n", peso);

    // Espera a que tienda a cero
    /*while (peso > 2) {
      peso = scale.get_units(5);
      delay(200);
    }*/
    sendData("nueces",peso);
    Serial.printf("nueces %.2f g\n", peso);
    
    delay(100);
  }
  button2_state = currentButton2_state;

  //boton 3

  int currentButton3_state = digitalRead(BUTTON2_PIN);
  if (currentButton3_state == LOW && button2_state == HIGH) {
    Serial.println("Botón 3 presionado.");

    moverServo(servo3, 3);

    float peso = getPesoHX711();
    Serial.printf("Función retornó diferencia = %.2f g\n", peso);

    // Espera a que tienda a cero
    /*while (peso > 2) {
      peso = scale.get_units(5);
      delay(200);
    }*/

    Serial.printf("anacardos %.2f g\n", peso);
    sendData("anacardos",peso);
    delay(100);
  }
  button3_state = currentButton3_state;


}

