import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const GENRES = [
  'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical',
  'Folk', 'R&B', 'Country', 'Reggae', 'Blues', 'Punk',
  'Metal', 'Indie', 'Alternative', 'Funk', 'Soul', 'Gospel'
];

const MOODS = [
  'Energetic', 'Chill', 'Melancholic', 'Uplifting', 'Aggressive',
  'Romantic', 'Mysterious', 'Nostalgic', 'Experimental', 'Peaceful'
];

export default function PreferencesScreen() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [minDuration, setMinDuration] = useState(60); // seconds
  const [maxDuration, setMaxDuration] = useState(300); // seconds
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', 'demo-user') // Replace with actual user ID
        .single();

      if (data) {
        setSelectedGenres(data.preferred_genres || []);
        setSelectedMoods(data.preferred_moods || []);
        setMinDuration(data.min_duration || 60);
        setMaxDuration(data.max_duration || 300);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: 'demo-user', // Replace with actual user ID
          preferred_genres: selectedGenres,
          preferred_moods: selectedMoods,
          min_duration: minDuration,
          max_duration: maxDuration,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: '#19161a' }} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center">
          <Text className="text-brand-text font-chillax">Loading preferences...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#19161a' }} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-brand-text text-2xl font-chillax-bold mb-2">Preferences</Text>
          <Text className="text-brand-text font-chillax">
            Customize your discovery experience
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Genres Section */}
          <View className="">
            <Text className="text-brand-text text-xl font-chillax-bold mb-4">
              Which genres do you prefer?
            </Text>
            <Text className="text-brand-text font-chillax mb-6">
              Choose your favorite genres for more personalized music
            </Text>
            
            <View className="flex-row flex-wrap">
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  onPress={() => toggleGenre(genre)}
                  className={`mr-3 mb-3 px-4 py-3 rounded-2xl ${
                    selectedGenres.includes(genre)
                      ? 'bg-brand-accent'
                      : 'bg-brand-backgroundLighter'
                  }`}
                >
                  <View className="flex-row items-center space-x-2">
                    <Text className={`font-chillax-medium ${
                      selectedGenres.includes(genre) ? 'text-brand-text' : 'text-brand-gray'
                    }`}>
                      {genre}
                    </Text>
                    {selectedGenres.includes(genre) && (
                      <Check size={16} color="#ded7e0" strokeWidth={1.5} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Moods Section */}
          <View className="mb-8">
            <Text className="text-brand-text text-xl font-chillax-bold mb-4">
              What moods do you enjoy?
            </Text>
            <Text className="text-brand-text font-chillax mb-6">
              Select moods that match your listening preferences
            </Text>
            
            <View className="flex-row flex-wrap">
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => toggleMood(mood)}
                  className={`mr-3 mb-3 px-4 py-3 rounded-2xl ${
                    selectedMoods.includes(mood)
                      ? 'bg-brand-accent'
                      : 'bg-brand-backgroundLighter'
                  }`}
                >
                  <View className="flex-row items-center space-x-2">
                    <Text className={`font-chillax-medium ${
                      selectedMoods.includes(mood) ? 'text-brand-text' : 'text-brand-gray'
                    }`}>
                      {mood}
                    </Text>
                    {selectedMoods.includes(mood) && (
                      <Check size={16} color="#ded7e0" strokeWidth={1.5} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Section */}
          <View className="mb-8">
            <Text className="text-brand-text text-xl font-chillax-bold mb-4">
              Track Duration
            </Text>
            <Text className="text-brand-text font-chillax mb-6">
              Set your preferred track length range
            </Text>
            
            <View className="bg-brand-backgroundLighter rounded-2xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-brand-gray font-chillax">
                  {Math.floor(minDuration / 60)}:{(minDuration % 60).toString().padStart(2, '0')}
                </Text>
                <Text className="text-brand-gray font-chillax">to</Text>
                <Text className="text-brand-gray font-chillax">
                  {Math.floor(maxDuration / 60)}:{(maxDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              
              {/* Duration sliders would go here - simplified for demo */}
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => setMinDuration(Math.max(30, minDuration - 30))}
                  className="bg-brand-backgroundLighter px-4 py-2 rounded-xl"
                >
                  <Text className="text-brand-gray font-chillax">-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMinDuration(minDuration + 30)}
                  className="bg-brand-backgroundLighter px-4 py-2 rounded-xl"
                >
                  <Text className="text-brand-gray font-chillax">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={savePreferences}
            className="bg-brand-accent rounded-2xl py-4 mb-8"
          >
            <Text className="text-brand-gray text-lg font-chillax-medium text-center">
              Save Preferences
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}