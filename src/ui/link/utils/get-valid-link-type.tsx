import { LinkElementType } from '../../../common/types';

const VALID_LINK_TYPES = ['a', 'button'];

export const getValidLinkType = (type: LinkElementType): LinkElementType =>
  VALID_LINK_TYPES.includes(type) ? type : 'a';
