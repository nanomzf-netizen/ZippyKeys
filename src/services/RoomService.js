import { ref, set, get, update, remove, onValue, serverTimestamp, runTransaction } from 'firebase/database';
import { db } from '../lib/firebase';
import TextProvider from './TextProvider';

class RoomService {
  /**
   * Generate random 6-character room code (A-Z, 0-9)
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create new room
   */
  async createRoom(userId, username, settings) {
    try {
      const roomCode = this.generateRoomCode();
      
      // Check if code already exists
      const roomRef = ref(db, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      
      if (snapshot.exists()) {
        // Retry with new code if exists
        return this.createRoom(userId, username, settings);
      }

      // Generate text once for the room so all players share the same text
      const generatedText = await TextProvider.generateInfiniteText(
        settings.textMode || 'words',
        settings.textCategory || 'english',
        parseInt(settings.duration || '30', 10)
      );

      const roomData = {
        code: roomCode,
        createdBy: username,
        createdAt: serverTimestamp(),
        status: 'waiting', // waiting | racing | finished
        text: generatedText, // Store the synchronized text
        settings: {
          duration: settings.duration || '30',
          textMode: settings.textMode || 'words',
          textCategory: settings.textCategory || 'english'
        },
        players: {
          [userId]: {
            username: username,
            wpm: 0,
            accuracy: 0,
            progress: 0,
            isReady: false,
            isFinished: false,
            position: 0
          }
        }
      };

      await set(roomRef, roomData);
      
      return { success: true, roomCode, room: roomData };
    } catch (error) {
      console.error('Create room error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Join existing room
   */
  async joinRoom(roomCode, userId, username) {
    try {
      const roomRef = ref(db, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Room tidak ditemukan' };
      }

      const room = snapshot.val();

      // Validations
      if (room.status !== 'waiting') {
        return { success: false, error: 'Room sudah dimulai atau selesai' };
      }

      const playerCount = room.players ? Object.keys(room.players).length : 0;
      if (playerCount >= 8) {
        return { success: false, error: 'Room sudah penuh (max 8 pemain)' };
      }

      // Check if user already in room
      if (room.players && room.players[userId]) {
        return { success: true, roomCode, room }; // Already joined
      }

      // Add player to room
      const playerRef = ref(db, `rooms/${roomCode}/players/${userId}`);
      await set(playerRef, {
        username: username,
        wpm: 0,
        accuracy: 0,
        progress: 0,
        isReady: false,
        isFinished: false,
        position: 0
      });

      return { success: true, roomCode, room };
    } catch (error) {
      console.error('Join room error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave room
   */
  async leaveRoom(roomCode, userId) {
    try {
      const playerRef = ref(db, `rooms/${roomCode}/players/${userId}`);
      await remove(playerRef);

      // Check if room is empty, delete it
      const playersRef = ref(db, `rooms/${roomCode}/players`);
      const playersSnapshot = await get(playersRef);
      const remainingPlayers = playersSnapshot.val();
      
      if (!remainingPlayers || Object.keys(remainingPlayers).length === 0) {
        // No players left, delete entire room
        const roomRef = ref(db, `rooms/${roomCode}`);
        await remove(roomRef);
      }

      return { success: true };
    } catch (error) {
      console.error('Leave room error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update player ready status
   */
  async setPlayerReady(roomCode, userId, isReady) {
    try {
      const playerRef = ref(db, `rooms/${roomCode}/players/${userId}/isReady`);
      await set(playerRef, isReady);
      return { success: true };
    } catch (error) {
      console.error('Set ready error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start race (set status to racing)
   */
  async startRace(roomCode) {
    try {
      const roomRef = ref(db, `rooms/${roomCode}`);
      await update(roomRef, {
        status: 'racing',
        startedAt: Date.now()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Start race error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update player stats during race
   */
  async updatePlayerStats(roomCode, userId, stats) {
    try {
      const updates = {};
      if (stats.wpm !== undefined) updates[`rooms/${roomCode}/players/${userId}/wpm`] = stats.wpm;
      if (stats.accuracy !== undefined) updates[`rooms/${roomCode}/players/${userId}/accuracy`] = stats.accuracy;
      if (stats.progress !== undefined) updates[`rooms/${roomCode}/players/${userId}/progress`] = stats.progress;
      if (stats.isFinished !== undefined) updates[`rooms/${roomCode}/players/${userId}/isFinished`] = stats.isFinished;
      
      await update(ref(db), updates);
      return { success: true };
    } catch (error) {
      console.error('Update stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Finish race and calculate rewards
   */
  async finishRace(roomCode, userId) {
    try {
      // Mark player as finished
      await this.updatePlayerStats(roomCode, userId, { isFinished: true });

      // Get room data to calculate positions
      const roomRef = ref(db, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        return { success: false, error: 'Room tidak ditemukan' };
      }

      const room = snapshot.val();
      const players = room.players || {};

      // Calculate positions based on who finished first and WPM
      const playerList = Object.entries(players).map(([id, data]) => ({
        id,
        ...data
      }));

      const finishedPlayers = playerList
        .filter(p => p.isFinished)
        .sort((a, b) => b.wpm - a.wpm); // Sort by WPM descending

      // Assign positions
      const updates = {};
      finishedPlayers.forEach((player, index) => {
        updates[`rooms/${roomCode}/players/${player.id}/position`] = index + 1;
      });

      await update(ref(db), updates);

      // Calculate coins reward
      const playerData = players[userId];
      const position = finishedPlayers.findIndex(p => p.id === userId) + 1;
      
      let coinsReward = 10; // Default
      if (position === 1) coinsReward = 50;
      else if (position === 2) coinsReward = 30;
      else if (position === 3) coinsReward = 20;

      // Award coins using transaction
      await this.awardCoins(userId, coinsReward);

      // Check if all players finished
      const allFinished = playerList.every(p => p.isFinished);
      if (allFinished) {
        const statusRef = ref(db, `rooms/${roomCode}/status`);
        await set(statusRef, 'finished');
      }

      return { success: true, position, coinsReward };
    } catch (error) {
      console.error('Finish race error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Award coins to user (using transaction for safety)
   */
  async awardCoins(userId, amount) {
    try {
      const coinsRef = ref(db, `users/${userId}/coins`);
      
      await runTransaction(coinsRef, (currentCoins) => {
        return (currentCoins || 0) + amount;
      });

      return { success: true };
    } catch (error) {
      console.error('Award coins error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listen to room changes
   */
  listenToRoom(roomCode, callback) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    return onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ exists: true, data: snapshot.val() });
      } else {
        callback({ exists: false, data: null });
      }
    });
  }

  /**
   * Get user coins
   */
  async getUserCoins(userId) {
    try {
      const coinsRef = ref(db, `users/${userId}/coins`);
      const snapshot = await get(coinsRef);
      return snapshot.exists() ? snapshot.val() : 0;
    } catch (error) {
      console.error('Get coins error:', error);
      return 0;
    }
  }

  /**
   * Listen to user coins
   */
  listenToUserCoins(userId, callback) {
    const coinsRef = ref(db, `users/${userId}/coins`);
    return onValue(coinsRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : 0);
    });
  }

  /**
   * Search users by username
   */
  async searchUsers(searchTerm) {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const users = snapshot.val();
      const results = [];

      Object.entries(users).forEach(([userId, userData]) => {
        if (userData.username && 
            userData.username.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            userId,
            username: userData.username,
            coins: userData.coins || 0
          });
        }
      });

      return results;
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  }

  /**
   * Send invite to user
   */
  async sendInvite(fromUserId, fromUsername, toUserId, roomCode) {
    try {
      const inviteId = Date.now().toString();
      const inviteRef = ref(db, `invites/${toUserId}/${inviteId}`);
      
      await set(inviteRef, {
        from: fromUsername,
        fromUserId: fromUserId,
        roomCode: roomCode,
        timestamp: serverTimestamp(),
        status: 'pending' // pending | accepted | rejected
      });

      // Auto-delete after 2 minutes
      setTimeout(async () => {
        try {
          const snapshot = await get(inviteRef);
          if (snapshot.exists() && snapshot.val().status === 'pending') {
            await remove(inviteRef);
          }
        } catch (err) {
          console.error('Auto-delete invite error:', err);
        }
      }, 2 * 60 * 1000);

      return { success: true };
    } catch (error) {
      console.error('Send invite error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listen to invites for a user
   */
  listenToInvites(userId, callback) {
    const invitesRef = ref(db, `invites/${userId}`);
    return onValue(invitesRef, (snapshot) => {
      if (snapshot.exists()) {
        const invites = [];
        snapshot.forEach((childSnapshot) => {
          invites.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        callback(invites.filter(inv => inv.status === 'pending'));
      } else {
        callback([]);
      }
    });
  }

  /**
   * Accept invite
   */
  async acceptInvite(userId, inviteId) {
    try {
      const inviteRef = ref(db, `invites/${userId}/${inviteId}`);
      await update(inviteRef, { status: 'accepted' });
      
      // Get invite data to return room code
      const snapshot = await get(inviteRef);
      if (snapshot.exists()) {
        const invite = snapshot.val();
        // Clean up invite
        await remove(inviteRef);
        return { success: true, roomCode: invite.roomCode };
      }
      
      return { success: false, error: 'Invite tidak ditemukan' };
    } catch (error) {
      console.error('Accept invite error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject invite
   */
  async rejectInvite(userId, inviteId) {
    try {
      const inviteRef = ref(db, `invites/${userId}/${inviteId}`);
      await remove(inviteRef);
      return { success: true };
    } catch (error) {
      console.error('Reject invite error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up expired rooms (older than 30 minutes AND still waiting)
   */
  async cleanupExpiredRooms() {
    try {
      const roomsRef = ref(db, 'rooms');
      const snapshot = await get(roomsRef);
      
      if (!snapshot.exists()) return;

      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;

      snapshot.forEach(async (childSnapshot) => {
        const room = childSnapshot.val();
        const roomCode = childSnapshot.key;
        
        // Only delete rooms that are still waiting and expired
        if (room.status === 'waiting' && room.createdAt) {
          const roomAge = now - room.createdAt;
          
          if (roomAge > thirtyMinutes) {
            await remove(ref(db, `rooms/${roomCode}`));
            console.log(`Cleaned up expired room: ${roomCode}`);
          }
        }
      });
    } catch (error) {
      console.error('Cleanup expired rooms error:', error);
    }
  }

  /**
   * Clean up old rooms (TTL 30 minutes)
   * @deprecated Use cleanupExpiredRooms() instead
   */
  async cleanupOldRooms() {
    return this.cleanupExpiredRooms();
  }
}

export default new RoomService();
