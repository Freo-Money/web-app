import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ClientsService } from 'app/clients/clients.service';
import { GroupsService } from 'app/groups/groups.service';

@Injectable({ providedIn: 'root' })
export class LoanAccountsListResolver {
  constructor(
    private clientsService: ClientsService,
    private groupsService: GroupsService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const clientId = this.findRouteParam(route, 'clientId');
    if (clientId) {
      return this.clientsService.getClientAccountData(clientId);
    }
    const groupId = this.findRouteParam(route, 'groupId');
    return this.groupsService.getGroupAccountsData(groupId);
  }

  private findRouteParam(route: ActivatedRouteSnapshot, param: string): string | null {
    let current: ActivatedRouteSnapshot | null = route;
    while (current) {
      const value = current.paramMap.get(param);
      if (value) {
        return value;
      }
      current = current.parent;
    }
    return null;
  }
}
