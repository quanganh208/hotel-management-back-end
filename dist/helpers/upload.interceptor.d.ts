import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare function UploadInterceptor(fieldName?: string): {
    new (): {
        intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    };
};
