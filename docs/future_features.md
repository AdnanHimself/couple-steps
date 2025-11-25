# Future Features

## Challenge Completion Chat Notifications

**Status:** Planned  
**Priority:** Medium

### Description
When a challenge is completed (either solo or couple), an automatic message should be sent to the chat notifying both users of the achievement.

### Implementation Details

1. **Trigger Location:** `AppContext.tsx` in the challenge completion check (lines ~302-332)
   
2. **Message Format:**
   - Solo Challenge: `"🥇 {username} completed the '{challenge title}' solo challenge!"`
   - Couple Challenge: `"🎉 You both completed the '{challenge title}' challenge together!"`

3. **Technical Approach:**
   ```typescript
   // In AppContext.tsx, after successful challenge completion
   if (success) {
       // Send automatic chat message
       if (challenge.type === 'couple' && partner) {
           await ChatService.sendSystemMessage(
               currentUser.id, 
               partner.id, 
               `🎉 You both completed the '${challenge.title}' challenge together!`
           );
       } else if (challenge.type === 'solo' && partner) {
           await ChatService.sendSystemMessage(
               currentUser.id,
               partner.id,
               `🥇 ${currentUser.username} completed the '${challenge.title}' solo challenge!`
           );
       }
   }
   ```

4. **ChatService Update Needed:**
   - Add `sendSystemMessage` method that creates messages with a special `is_system` flag
   - System messages should have distinct styling in the chat UI (centered, italicized, different color)

5. **Database Schema:**
   - Add `is_system: boolean` column to `messages` table (default: false)
   - System messages should not trigger notifications/nudges

### Dependencies
- ChatService enhancement
- Database migration for `messages` table
- Chat UI component update for system message styling

### Notes
- This feature was requested on 2025-11-21
- Should be implemented after core challenge functionality is stable
- Consider adding similar notifications for streak milestones
