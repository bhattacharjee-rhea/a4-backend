import AuthenticatingConcept from "./concepts/authenticating";
import FriendingConcept from "./concepts/friending";
import GroupingConcept from "./concepts/grouping";
import LikingConcept from "./concepts/liking";
import PermittingConcept from "./concepts/permitting";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Liking = new LikingConcept("likes");
export const Grouping = new GroupingConcept("groups");
export const ViewPermitting = new PermittingConcept("view permissions");
export const LikePermitting = new PermittingConcept("like permissions");
