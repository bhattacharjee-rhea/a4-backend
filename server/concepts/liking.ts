import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface LikeDoc extends BaseDoc {
  user: ObjectId;
  post: ObjectId;
}

/**
 * concept: Liking [User, Post]
 */
export default class LikingConcept {
  public readonly likes: DocCollection<LikeDoc>;

  /**
   * Make an instance of Liking.
   */
  constructor(collectionName: string) {
    this.likes = new DocCollection<LikeDoc>(collectionName);
  }

  async like(user: ObjectId, post: ObjectId) {
    const like = await this.likes.readOne({ user, post });
    if (like !== null) {
      throw new NotAllowedError("Post is already liked!");
    }

    const _id = await this.likes.createOne({ user, post });
    return { msg: "Post successfully liked!", post: await this.likes.readOne({ _id }) };
  }

  async unlike(user: ObjectId, post: ObjectId) {
    const like = await this.likes.popOne({ user, post });
    if (like === null) {
      throw new NotAllowedError("Post is not liked!");
    }

    return { msg: "Unliked!" };
  }

  async isLikedByUser(user: ObjectId, post: ObjectId) {
    const like = await this.likes.readOne({ user, post });
    return like !== null;
  }

  async getLikesForPost(post: ObjectId) {
    return await this.likes.readMany({ post });
  }
}
