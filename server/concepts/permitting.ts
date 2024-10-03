import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PermissionDoc extends BaseDoc {
  group: ObjectId;
  post: ObjectId;
  view: boolean;
  like: boolean;
}

/**
 * concept: Permitting [Post, Group]
 */
export default class PermittingConcept {
  public readonly permissions: DocCollection<PermissionDoc>;

  /**
   * Make an instance of Permitting.
   */
  constructor(collectionName: string) {
    this.permissions = new DocCollection<PermissionDoc>(collectionName);
  }

  async create(group: ObjectId, post: ObjectId, view: boolean, like: boolean) {
    const _id = await this.permissions.createOne({ group, post, view, like });
    return { msg: "Permission successfully created!", permission: await this.permissions.readOne({ _id }) };
  }

  async remove(permission: ObjectId) {
    await this.permissions.deleteOne({ _id: permission });
    return { msg: "Permission deleted successfully!" };
  }

  async canView(group: ObjectId, post: ObjectId) {
    const permission = await this.permissions.readOne({ group, post });
    if (permission === null) {
      throw new NotFoundError("Permission not found!");
    }
    return permission.view;
  }

  async assertCanView(group: ObjectId, post: ObjectId) {
    const view = await this.canView(group, post);
    if (!view) {
      throw new NotAllowedError("You do not have permission to view this post!");
    }
  }

  async canLike(group: ObjectId, post: ObjectId) {
    const permission = await this.permissions.readOne({ group, post });
    if (permission === null) {
      throw new NotFoundError("Permission not found!");
    }
    return permission.like;
  }

  async assertCanLike(group: ObjectId, post: ObjectId) {
    const like = await this.canLike(group, post);
    if (!like) {
      throw new NotAllowedError("You do not have permission to like this post!");
    }
  }

  async getPostPermissions(post: ObjectId) {
    return await this.permissions.readMany({ post });
  }
}
