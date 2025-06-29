import { supabase } from './supabase';
import { Profile, AuthUser } from '@/types';

export class AuthService {
  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // If there's an authentication error (like invalid refresh token), clear the session
      if (authError) {
        console.warn('Authentication error detected, clearing session:', authError.message);
        // Clear the invalid session silently
        await supabase.auth.signOut();
        return null;
      }


      // Get user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      return {
        id: user.id,
        email: user.email || '',
        profile: profile || null,
      };
    } catch (error) {
      console.error('Unexpected error in getCurrentUser:', error);
      return null;
    }
  }

  static async updateProfile(updates: Partial<Profile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeOnboarding(profileData: {
    username?: string;
    display_name?: string;
    preferred_genres?: string[];
    preferred_moods?: string[];
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: profileData.username,
        display_name: profileData.display_name,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Update preferences if provided
    if (profileData.preferred_genres || profileData.preferred_moods) {
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert({
          profile_id: user.id,
          user_id: user.id, // Keep for backward compatibility
          preferred_genres: profileData.preferred_genres || [],
          preferred_moods: profileData.preferred_moods || [],
          min_duration: 60, // Default values
          max_duration: 300,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (prefsError) throw prefsError;
    }

    // Initialize user stats
    const { error: statsError } = await supabase
      .from('user_stats')
      .upsert({
        profile_id: user.id,
        user_id: user.id, // Keep for backward compatibility
        total_tracks_rated_count: 0,
        current_streak_days: 0,
        longest_streak_days: 0,
        total_points: 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (statsError) throw statsError;
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser = await this.getCurrentUser();
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }
}