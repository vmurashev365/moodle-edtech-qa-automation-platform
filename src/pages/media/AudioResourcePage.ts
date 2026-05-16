import { mediaSelectors } from '../../ui-map/media.selectors';
import { BasePage } from '../base/BasePage';

export class AudioResourcePage extends BasePage {
  async open(resourceName: string): Promise<void> {
    void resourceName;
    void mediaSelectors;
    this.pendingSelectors('audio resource navigation');
  }

  async expectControlsVisible(): Promise<void> {
    this.pendingSelectors('audio resource controls assertion');
  }
}
