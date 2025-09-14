import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface TimePickerProps {
  time: Date;
  onTimeChange: (time: Date) => void;
  label?: string;
  colors: {
    text: string;
    primary: string;
    card: string;
    muted: string;
  };
  style?: any;
}

export function TimePicker({ time, onTimeChange, label, colors, style }: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedTime) {
      onTimeChange(selectedTime);
    }
  };

  return (
    <View style={style}>
      {label && (
        <Text style={{ color: colors.text, fontSize: 16, marginBottom: 8 }}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.card,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.primary + '40',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={{ 
            color: colors.text, 
            fontSize: 16, 
            marginLeft: 8,
            fontWeight: '500'
          }}>
            {formatTime(time)}
          </Text>
        </View>
        
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          style={{ backgroundColor: colors.card }}
        />
      )}
    </View>
  );
}