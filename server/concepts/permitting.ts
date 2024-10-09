import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface PermissionDoc extends BaseDoc {
  target: ObjectId;
  resource: ObjectId;
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

  async create(target: ObjectId, resource: ObjectId) {
    const _id = await this.permissions.createOne({ target, resource });
    return { msg: "Permission successfully created!", permission: await this.permissions.readOne({ _id }) };
  }

  async delete(target: ObjectId, resource: ObjectId) {
    await this.permissions.deleteOne({ target, resource });
    return { msg: "Permission deleted successfully!" };
  }

  async permissionExistsForAny(targets: ObjectId[], resource: ObjectId) {
    const granted_permissions = await this.permissions.readMany({ resource });
    const permitted_targets = granted_permissions.map((permission) => permission.target.toString());
    const overlap = permitted_targets.filter((target) => targets.map((t) => t.toString()).includes(target));

    return overlap.length > 0;
  }

  async assertPermissionExistsForAny(targets: ObjectId[], resource: ObjectId) {
    const permission = this.permissionExistsForAny(targets, resource);
    if (!permission) {
      throw new NotAllowedError("You do not have permission to do this!");
    }
  }

  async getPermissionsForResource(resource: ObjectId) {
    return await this.permissions.readMany({ resource });
  }
}
