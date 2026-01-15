import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
      <Text style={{ color: '#fff', fontSize: 20 }}>Minimal Test App</Text>
      <Text style={{ color: '#999', marginTop: 10 }}>If you see this, the issue is in one of the imports</Text>
    </View>
  );
}
