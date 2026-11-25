/// Build-time configuration. Override with:
///   flutter run --dart-define=API_URL=http://10.0.2.2:3000 --dart-define=API_TOKEN=secret
/// (10.0.2.2 is the host machine from the Android emulator.)
class AppConfig {
  static const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:3000');
  static const apiToken = String.fromEnvironment('API_TOKEN');
}
