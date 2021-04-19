import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { Comment } from '../shared/comment';
import { visibility, flyInOut, expand } from '../animations/app.animation';

@Component({
	selector: 'app-dishdetail',
	templateUrl: './dishdetail.component.html',
	styleUrls: ['./dishdetail.component.scss'],
	animations: [
		trigger('visibility', [
			state('shown', style({
				transform: 'scale(1.0)',
				opacity: 1
			})),
			state('hidden', style({
				transform: 'scale(0.5)',
				opacity: 0
			})),
			transition('* => *', animate('0.5s ease-in-out'))
		]),
		flyInOut(),
		expand()
	]
})

export class DishdetailComponent implements OnInit {

	dish: Dish;
	dishIds: string[];
	prev: string;
	next: string;

	commentForm: FormGroup;
	comment: Comment;

	formErrors = {
		'author': '',
		'comment': ''
	};

	validationMessages = {
		'author': {
			'required': 'Name is required.',
			'minlength': 'Name must be at least 2 characters long.',
			'maxlength': 'Name cannot be more than 25 characters long.'
		},
		'comment': {
			'required': 'Comment is required.',
			'minlength': 'Comment must be at least 1 characters long.'
		}
	};

	errMess: string;

	dishcopy: Dish;

	visibility = 'shown';
	


	constructor(private dishservice: DishService,
		private route: ActivatedRoute,
		private location: Location,
		private fb: FormBuilder,
		@Inject('baseURL') private baseURL) {
		this.createForm();
	}

	ngOnInit() {
		this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds, errmess => this.errMess = <any>errmess);
		this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(params['id']); }))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
      errmess => this.errMess = <any>errmess);
	}

	setPrevNext(dishId: string) {
		const index = this.dishIds.indexOf(dishId);
		this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
		this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
	}

	goBack(): void {
		this.location.back();
	}

	createForm() {
		this.commentForm = this.fb.group({
			author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
			comment: ['', [Validators.required, Validators.minLength(1)]],
			rating: 5
		});

		this.commentForm.valueChanges
			.subscribe(data => this.onValueChanged(data));

		this.onValueChanged();
	}

	onValueChanged(data?: any) {
		if (!this.commentForm) { return; }
		const form = this.commentForm;
		for (const field in this.formErrors) {
			// clear previous error message (if any)
			this.formErrors[field] = '';
			const control = form.get(field);
			if (control && control.dirty && !control.valid) {
				const messages = this.validationMessages[field];
				for (const key in control.errors) {
					this.formErrors[field] += messages[key] + ' ';
				}
			}
		}
		this.comment = form.value;
	}

	onSubmit() {
		this.comment = this.commentForm.value;
		this.comment.date = new Date().toISOString();
		this.dish.comments.push(this.comment);
		console.log(this.comment);
		this.comment = null;
		this.commentForm.reset({
			author: '',
			comment: '',
			rating: 5
		});

		this.dishcopy.comments.push(this.comment);
		this.dishService.putDish(this.dishcopy).subscribe(dish => {this.dish = dish; this.dishcopy = dish;}, errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
	}


}
