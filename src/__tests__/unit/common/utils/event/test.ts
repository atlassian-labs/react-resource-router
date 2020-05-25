import {
  isKeyboardEvent,
  isModifiedEvent,
} from '../../../../../common/utils/event';

describe('SPA Router event utils', () => {
  describe('isModifiedEvent()', () => {
    const baseEvent = {
      type: 'keypress',
    };
    const events = [
      [{ type: 'keypress', metaKey: true }],
      [{ type: 'keypress', altKey: true }],
      [{ type: 'keypress', ctrlKey: true }],
      [{ type: 'keypress', shiftKey: true }],
      [{ type: 'keydown', metaKey: true }],
      [{ type: 'keydown', altKey: true }],
      [{ type: 'keydown', ctrlKey: true }],
      [{ type: 'keydown', shiftKey: true }],
      [{ type: 'keyup', metaKey: true }],
      [{ type: 'keyup', altKey: true }],
      [{ type: 'keyup', ctrlKey: true }],
      [{ type: 'keyup', shiftKey: true }],
    ];

    it.each(events)(
      'should return true if any of the event modifiers are present',
      // @ts-ignore
      (event: any) => {
        expect(isModifiedEvent(event)).toBeTruthy();
      }
    );

    it('should return false if no modifiers are present', () => {
      expect(isModifiedEvent(baseEvent)).toBeFalsy();
    });
  });

  describe('isKeyboardEvent()', () => {
    it('returns true for keyboard events', () => {
      expect(
        isKeyboardEvent({
          type: 'keypress',
        })
      ).toBeTruthy();
    });

    it('returns false for any other event', () => {
      expect(
        isKeyboardEvent({
          type: 'mousedown',
        })
      ).toBeFalsy();
    });
  });
});
