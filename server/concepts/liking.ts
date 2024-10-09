import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface LikeDoc extends BaseDoc {
  likedBy: ObjectId;
  item: ObjectId;
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

  async like(likedBy: ObjectId, item: ObjectId) {
    const like = await this.likes.readOne({ likedBy, item });
    if (like !== null) {
      throw new NotAllowedError("Item is already liked!");
    }

    const _id = await this.likes.createOne({ likedBy, item });
    return { msg: "Item successfully liked!", like: await this.likes.readOne({ _id }) };
  }

  async unlike(likedBy: ObjectId, item: ObjectId) {
    const like = await this.likes.popOne({ likedBy, item });
    if (like === null) {
      throw new NotAllowedError("Item is not liked!");
    }

    return { msg: "Unliked!" };
  }

  async isLikedByUser(user: ObjectId, item: ObjectId) {
    const like = await this.likes.readOne({ user, item });
    return like !== null;
  }

  async getLikesForItem(item: ObjectId) {
    return await this.likes.readMany({ item });
  }
}
