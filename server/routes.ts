import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Friending, Grouping, Liking, Permitting, Posting, Sessioning } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  //like a post
  @Router.put("/likes/:postId")
  async likePost(session: SessionDoc, postId: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(postId);
    return await Liking.like(user, oid);
  }

  //unlike a post
  @Router.delete("/likes/:postId")
  async unlikePost(session: SessionDoc, postId: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(postId);
    return await Liking.unlike(user, oid);
  }

  //get post likes
  @Router.get("/likes/:postId")
  async getPostLikes(session: SessionDoc, postId: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(postId);
    await Posting.assertAuthorIsUser(oid, user);
    return await Liking.getLikesForPost(oid);
  }

  //is a post liked by user
  @Router.get("/likes/user/:postId")
  async isPostLikedByUser(session: SessionDoc, postId: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(postId);
    return await Liking.isLikedByUser(user, oid);
  }

  // create a group
  @Router.post("/groups/:name")
  async createGroup(session: SessionDoc, name: string) {
    const user = Sessioning.getUser(session);
    return await Grouping.create(name, user);
  }

  // delete a group
  @Router.delete("/groups/:groupId")
  async deleteGroup(session: SessionDoc, groupId: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(groupId);
    await Grouping.assertAuthorIsCreator(oid, user);
    return await Grouping.delete(oid);
  }

  // add to group
  @Router.put("/groups/:groupId/:userId")
  async addFriendToGroup(session: SessionDoc, groupId: string, userId: string) {
    const user = Sessioning.getUser(session);
    const user_oid = new ObjectId(userId);
    const group_oid = new ObjectId(groupId);
    await Friending.assertFriendshipExists(user, user_oid);
    return await Grouping.addToGroup(group_oid, user_oid);
  }

  // remove from group
  @Router.delete("/groups/:groupId/:userId")
  async removeFriendFromGroup(session: SessionDoc, groupId: string, userId: string) {
    const user = Sessioning.getUser(session);
    const user_oid = new ObjectId(userId);
    const group_oid = new ObjectId(groupId);
    await Friending.assertFriendshipExists(user, user_oid);
    return await Grouping.removeFromGroup(group_oid, user_oid);
  }

  // get user's groups
  @Router.get("/groups")
  async getGroups(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Grouping.getGroupsByCreator(user);
  }

  // get group
  @Router.get("/groups/:groupId")
  async getGroupById(session: SessionDoc, groupId: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(groupId);
    Grouping.assertAuthorIsCreator(oid, user);
    return await Grouping.getGroup(oid);
  }

  // get permissions for a post
  @Router.get("/permissions/:postId")
  async getPostPermissions(session: SessionDoc, postId: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(postId);
    Posting.assertAuthorIsUser(oid, user);

    return await Permitting.getPostPermissions(oid);
  }

  // get viewable posts
  @Router.get("/permissions/viewable")
  async getViewablePosts(session: SessionDoc) {
    return;
  }

  // get likeable posts
  @Router.get("/permissions/likable")
  async getLikeablePosts(session: SessionDoc) {
    return;
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
