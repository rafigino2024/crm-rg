import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:material_ui/material_ui.dart';

import 'screens/chat_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/leads_screen.dart';
import 'screens/tasks_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('he_IL');
  runApp(const ProviderScope(child: CrmApp()));
}

class CrmApp extends StatelessWidget {
  const CrmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CRM-RG',
      debugShowCheckedModeBanner: false,
      // Hebrew + RTL throughout the app.
      locale: const Locale('he', 'IL'),
      supportedLocales: const [Locale('he', 'IL'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      // Bundled Hebrew font: consistent on all platforms, no runtime download on web.
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true, fontFamily: 'Heebo'),
      darkTheme: ThemeData(
        colorSchemeSeed: Colors.indigo,
        brightness: Brightness.dark,
        useMaterial3: true,
        fontFamily: 'Heebo',
      ),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  static const _pages = [DashboardScreen(), LeadsScreen(), TasksScreen(), ChatScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'דשבורד',
          ),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'לידים'),
          NavigationDestination(
            icon: Icon(Icons.task_alt_outlined),
            selectedIcon: Icon(Icons.task_alt),
            label: 'משימות',
          ),
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome),
            label: 'עוזר AI',
          ),
        ],
      ),
    );
  }
}
