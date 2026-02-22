import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-profile-image',
  imports: [NgOptimizedImage],
  templateUrl: './profile-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileImageComponent {}
