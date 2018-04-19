import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../../common/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-alertservice',
  templateUrl: './alert-service.component.html',
  providers: [EntityFormService, FieldRelationService]
})
export class AlertServiceComponent implements OnInit {

  protected addCall = 'alertservice.create';
  protected queryCall = 'alertservice.query';
  protected editCall = 'alertservice.update';
  protected testCall = 'alertservice.test';
  public route_success: string[] = ['system', 'alertservice'];
  protected isNew = true;
  protected pk: any;
  public selectedType = 'Mail';

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: 'Name',
    },
    {
      type: 'checkbox',
      name: 'enabled',
      placeholder: 'Enabled',
      value: false,
    },
    {
      type: 'select',
      name: 'type',
      placeholder: 'Type',
      options: [{
        label: 'E-Mail',
        value: 'Mail',
      }, {
        label: 'SNMP Trap',
        value: 'SNMPTrap',
      }],
      value: 'Mail',
    },
  ];

  public emailFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      inputType: 'email',
      name: 'email_address',
      placeholder: 'E-mail address',
    }
  ];

  public snmpTrapFieldConfig: FieldConfig[] = [];


  public formGroup: any;
  public activeFormGroup: any;
  public emailFormGroup: any;
  public snmpTrapFormGroup: any;

  constructor(protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    protected snackBar: MatSnackBar,) {}

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.emailFormGroup = this.entityFormService.createFormGroup(this.emailFieldConfig);
    this.snmpTrapFormGroup = this.entityFormService.createFormGroup(this.snmpTrapFieldConfig);

    this.activeFormGroup = this.emailFormGroup;
    this.formGroup.controls['type'].valueChanges.subscribe((res) => {
      this.selectedType = res;
      if (res == 'Mail') {
        this.activeFormGroup = this.emailFormGroup;
      } else if (res == 'SNMPTrap') {
        this.activeFormGroup = this.snmpTrapFormGroup;
      }
    });

    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      if (this.pk) {
        this.isNew = false;
        this.ws.call(this.queryCall, [[['id', '=', this.pk]]]).subscribe((res) => {
          console.log(res[0]);
          for (const i in this.formGroup.controls) {
            this.formGroup.controls[i].setValue(res[0][i]);
          }
          for (const j in this.activeFormGroup.controls) {
            this.activeFormGroup.controls[j].setValue(res[0].attributes[j]);
          }
        })
      } else {
        this.isNew = true;
      }
    });
  }

  onSubmit(event: Event) {
    console.log(this.formGroup.value, this.activeFormGroup.value);
    let payload = _.cloneDeep(this.formGroup.value);
    let serviceValue = _.cloneDeep(this.activeFormGroup.value);

    payload['attributes'] = serviceValue;
    payload['settings'] = {};

    this.loader.open();
    if (this.isNew) {
      this.ws.call(this.addCall, [payload]).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
        });
    } else {
      this.ws.call(this.editCall, [this.pk, payload]).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
          console.log(res);
        });
    }
      
  }

  sendTestAlet() {
    console.log('send test alert');
    let testPayload = _.cloneDeep(this.formGroup.value);
    let serviceValue = _.cloneDeep(this.activeFormGroup.value);

    testPayload['attributes'] = serviceValue;
    testPayload['settings'] = {};

    this.loader.open();
    this.ws.call(this.testCall, [testPayload]).subscribe(
      (res) => {
        this.loader.close();
        if (res) {
          this.snackBar.open('A test alert send out successfully!', 'close', { duration: 5000 });
        } else {
          this.snackBar.open('A test alert send out failed!', 'close', { duration: 5000 });
        }
      },
      (res) => {
        this.loader.close();
        console.log(res);
      });
  }

  goBack() {
    this.router.navigate(new Array('/').concat(this.route_success));
  }
}
