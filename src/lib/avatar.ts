/**
 * Gets user initials from email address
 * For test@test.com, returns "T"
 */
export function getInitialsFromEmail(email: string | null | undefined): string {
  if (!email) return "?";
  
  // Get the part before @ symbol
  const localPart = email.split("@")[0];
  if (!localPart || localPart.length === 0) return "?";
  
  // Return the first letter, uppercase
  return localPart[0].toUpperCase();
}

/**
 * Gets the user's avatar URL from Supabase user metadata
 * Returns null if no avatar is available
 */
export function getAvatarUrl(user: any): string | null {
  if (!user) return null;
  
  // Check for Google profile picture (can be in different places)
  const avatarUrl = 
    user.user_metadata?.avatar_url || 
    user.user_metadata?.picture || 
    user.avatar_url ||
    null;
  
  return avatarUrl;
}

/**
 * Gets initials from user object (name or email)
 */
export function getUserInitials(user: any): string {
  if (!user) return "?";
  
  // Try to get from name first (for Google users)
  const name = user.user_metadata?.full_name || 
               user.user_metadata?.name || 
               user.name || 
               null;
  
  if (name) {
    // Get first letter of first word and optionally first letter of last word
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }
  
  // Fallback to email
  return getInitialsFromEmail(user.email);
}


